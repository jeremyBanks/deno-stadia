import { assert, notImplemented } from "../_common/assertions.ts";
import { Json } from "../_common/json.ts";
import * as json from "../_common/json.ts";
import { eprintln, println } from "../_common/io.ts";
import * as protos from "./protos.ts";
import { Proto } from "./protos.ts";
import { safeEval } from "../_common/sandbox.ts";
import { log, z } from "../deps.ts";
import { throttled } from "../_common/async.ts";
import { skuFromProto } from "./models.ts";
import * as models from "../stadia/models.ts";

const minRequestIntervalSeconds = 420 / 69;
const fetch = throttled(minRequestIntervalSeconds, globalThis.fetch);

const stadiaRoot = new URL("https://stadia.google.com/");
const allowedRoots = [
  stadiaRoot,
  new URL("https://lh3.googleusercontent.com/"),
];

const rpcUrl = new URL(
  "/_/CloudcastPortalFeWebUi/data/batchexecute",
  stadiaRoot,
);

export class GoogleCookies {
  constructor(
    readonly SID: string,
    readonly SSID: string,
    readonly HSID: string,
  ) {}

  static fromString(cookieString: string) {
    const cookies = Object.fromEntries(
      cookieString.split(/;[; ]*/g).filter(Boolean).map((s) =>
        s.trim().split(/=/)
      ),
    );
    return new GoogleCookies(
      cookies["SID"] ?? "",
      cookies["SSID"] ?? "",
      cookies["HSID"] ?? "",
    );
  }

  toString() {
    return `SID=${this.SID};SSID=${this.SSID};HSID=${this.HSID}`;
  }
}

export class Client {
  public readonly googleId: string;
  private readonly googleCookies: GoogleCookies;

  public constructor(
    googleId: string,
    googleCookies: GoogleCookies,
  ) {
    this.googleId = googleId;
    this.googleCookies = googleCookies;
  }

  public async fetchHttp(path: string, body?: RequestInit["body"]) {
    const url = new URL(path, stadiaRoot);
    if (!allowedRoots.some((root) => root.origin === url.origin)) {
      // Don't accidentally send Google cookies to the wrong host.
      throw new TypeError(`${url} is not in ${allowedRoots}`);
    }

    const method = body == undefined ? "GET" : "POST";

    const headers: Record<string, string> = {
      "user-agent": [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "AppleWebKit/537.36 (KHTML, like Gecko)",
        "Chrome/86.0.4240.198",
        "Safari/537.36",
      ].join(" "),

      "cookie": Object.entries(this.googleCookies).map(([k, v]) => `${k}=${v};`)
        .join(" "),

      "origin": "https://stadia.google.com",
    };

    if (body instanceof URLSearchParams) {
      headers["content-type"] =
        "application/x-www-form-urlencoded;charset=UTF-8";
    }

    const request = {
      googleId: this.googleId,
      timestamp: Date.now(),
      path: url.pathname,
    };

    log.info(`${method} ${url} ${body} for Google user ${this.googleId}`);

    const httpResponse = await fetch(url, { headers, body, method });

    if (httpResponse.status !== 200) {
      throw new Error(
        `http status ${httpResponse.status} ${httpResponse.statusText}`,
      );
    }

    return { request, httpResponse };
  }

  async fetchPage(path: string) {
    const { request, httpResponse } = await this.fetchHttp(path);

    let error: Json = null;
    let wizGlobalData: Json & (Record<string, Json>) = {};

    if (httpResponse.status === 200) {
      const html = await httpResponse.text();

      wizGlobalData = await safeEval(
        "(" +
          (html.match(/WIZ_global_data =(.+?);<\/script>/s)
            ?.[1] ?? "null") +
          ")",
      ) as Record<string, Json>;
    } else {
      error = {
        message: `non-200 http response status (${httpResponse.status})`,
      };
    }

    const response = {
      status: httpResponse.status,
      timestamp: Date.now(),
      error,
      wizGlobalData,
    };

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    return { request, httpResponse, response };
  }

  rpcSourcePage?: ReturnType<Client["fetchPage"]>;
  async rpcSourcePageWizGlobalData() {
    this.rpcSourcePage ??= this.fetchPage("settings");
    return (await this.rpcSourcePage).response.wizGlobalData as Record<
      string,
      string
    >;
  }

  async fetchRpcBatch(
    rpcidRequestPairs: Array<[string, Proto]>,
  ) {
    // https://kovatch.medium.com/deciphering-google-batchexecute-74991e4e446c
    const rpcids = rpcidRequestPairs.map(([rpcid, _request]) => rpcid);

    const fReq = json.encode([
      rpcidRequestPairs.map(([rpcid, request], index) => {
        return [rpcid, json.encode(request), null, String(index + 1)];
      }),
    ]);

    log.debug(`RPC ${Deno.inspect(rpcidRequestPairs)}`);

    const wizGlobalData = await this.rpcSourcePageWizGlobalData();
    const aToken = wizGlobalData["SNlM0e"];
    const backendRelease = wizGlobalData["cfb2h"];
    const fSid = wizGlobalData["FdrFJe"];

    const requestId = Math.floor(Math.random() * 1_000_000).toString();

    const humanLanguage = "en";

    const getParams = new URLSearchParams();
    getParams.set("rpcids", rpcids.join(","));
    getParams.set("f.sid", fSid);
    getParams.set("bl", backendRelease);
    getParams.set("hl", humanLanguage);
    getParams.set("_reqid", requestId);
    getParams.set("rt", "c");

    const postParams = new URLSearchParams();
    postParams.set("f.req", fReq);
    postParams.set("at", aToken);

    const url = new URL(rpcUrl.toString());
    url.search = getParams.toString();

    const { httpResponse } = await this.fetchHttp(url.toString(), postParams);

    const text = await httpResponse.text();
    const envelopes = text.split(/\n\d+\n/).slice(1).map((x) =>
      (json.decode(x) as any)[0]
    );
    log.debug("envelopes: " + Deno.inspect(envelopes, { iterableLimit: 4 }));
    const responseEnvelopes = envelopes.filter((x: any) => x[0] === "wrb.fr")
      .sort(
        (a: any, b: any) => Number(a[6]) - Number(b[6]),
      );
    const responses = responseEnvelopes.map((r: any) =>
      json.decode(r[2])
    ) as Array<Array<Proto>>;
    log.debug("responses: " + Deno.inspect(responses, { iterableLimit: 4 }));

    return {
      httpResponse,
      responses,
    };
  }

  async fetchRpc(
    rpcId: string,
    request: Proto,
  ) {
    const { httpResponse, responses: [response] } = await this.fetchRpcBatch(
      [[rpcId, request]],
    );
    return {
      httpResponse,
      response,
    };
  }

  async *fetchCaptures(pageToken: string | null = null): AsyncGenerator<{
    captureId: string;
    gameId: string;
    gameName: string;
    timestamp: number;
    imageUrl?: string;
    videoUrl?: string;
  }> {
    log.debug(`Fetching captures with page token ${pageToken}`);
    const pageSize = 99;
    const response = await this.fetchRpc(
      "CmnEcf",
      [[pageSize, pageToken]],
    );
    const nextPageToken = (response.response as any)[1] as string | undefined;
    const capturesData = (response.response as any)?.[0].filter((x: unknown) =>
      x instanceof Array
    );
    const captures = (capturesData as Array<any>).map((proto) => ({
      captureId: proto[1] as string,
      gameId: proto[2][0] as string,
      gameName: proto[3] as string,
      timestamp: proto[4][0] as number,
      imageUrl: proto[7]?.[1] as string | undefined,
      videoUrl: proto[8]?.[1] as string | undefined,
    })) ?? [];

    log.debug(
      `Got page of ${captures.length} captures and a next page token ${nextPageToken}`,
    );

    for (const capture of captures) {
      yield capture;
    }

    if (captures.length == pageSize) {
      yield* this.fetchCaptures(nextPageToken);
    }
  }

  async f() {
    this.fetchRpc("v2jaIb", []);
  }

  async fetchStoreList(listId: number) {
    const response = await this.fetchRpc(
      "ZAm7We",
      [null, null, null, null, null, listId],
    );
    return ((response.response as any)[0] as Proto[][][]).map((proto) =>
      skuFromProto(proto[9])
    );
  }

  async fetchSku(skuId: string): Promise<models.Sku> {
    const response = await this.fetchRpc(
      "FWhQV",
      [null, skuId],
    );

    return skuFromProto((response.response as any)[16]);
  }

  async fetchGame(gameId: string): Promise<Array<models.Sku>> {
    const response = await this.fetchRpc(
      "ZAm7We",
      [gameId, [1, 2, 3, 4, 6, 7, 8, 9, 10]],
    );

    return (response.response as any)[0].map((x: any) => skuFromProto(x[9]));
  }

  async fetchPlayer(
    playerId: string,
    includeStatus = true,
  ): Promise<{
    player: models.Player;
    friends: models.PlayerFriends | null;
    playedGames: models.PlayerGames | null;
    gameStats: models.PlayerGameStats | null;
  }> {
    const { responses: [playerResponse, friendsResponse, gamesResponse] } =
      await this.fetchRpcBatch([
        [
          "D0Amud",
          [null, includeStatus, null, null, playerId],
        ],
        [
          "Z5HRnb",
          [null, includeStatus, playerId],
        ],
        [
          "Q6jt8c",
          [null, null, null, playerId],
        ],
      ]);

    const player = models.playerFromProto((playerResponse as any)[5]);

    const friendPlayerIds =
      (friendsResponse as any)?.[0]?.map((x: any) =>
        models.playerFromProto(x).playerId
      ) ??
        null;

    const friends = friendPlayerIds
      ? models.PlayerFriends.parse({
        type: "player.friends",
        playerId,
        friendPlayerIds,
      })
      : null;

    const playedGameIds = (gamesResponse as any)?.[0] ?? null;
    const playedGames: models.PlayerGames | null = playedGameIds
      ? {
        type: "player.games",
        playerId,
        playedGameIds,
      }
      : null;

    const gameStats: models.PlayerGameStats | null = playedGameIds
      ? {
        type: "player.gamestats",
        playerId,
        proto: await this.fetchPlayerGameStats(
          playerId,
          playedGameIds,
        ),
      }
      : null;

    return { player, friends, playedGames, gameStats };
  }

  async fetchPlayerGameStats(
    playerId: string,
    gameIds: Array<string>,
  ): Promise<unknown> {
    const { responses } = await this.fetchRpcBatch(
      gameIds.map((gameId) => [
        "e7h9qd",
        [null, gameId, playerId],
      ]),
    );

    return responses?.[0]?.[0];
  }

  async fetchPlayerSearch(namePrefix: string) {
    namePrefix = z.string().min(2).max(20).parse(namePrefix);
    const q = namePrefix.slice(0, 1) + " " + namePrefix.slice(1);
    await this.fetchRpc("FdyJ0", [q]);
  }
}
