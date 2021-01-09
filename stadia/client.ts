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

  /** Makes a Stadia frontend RPC call from the context of a response page.
  *
  * Based on
  * https://kovatch.medium.com/deciphering-google-batchexecute-74991e4e446c
  */
  async fetchRpc(
    rpcId: string,
    request: Proto,
  ) {
    // TODO: automatically batch RPC requests?

    const fReq = json.encode([[[rpcId, json.encode(request), null, "1"]]]);

    const wizGlobalData = await this.rpcSourcePageWizGlobalData();
    const aToken = wizGlobalData["SNlM0e"];
    const backendRelease = wizGlobalData["cfb2h"];
    const fSid = wizGlobalData["FdrFJe"];

    const requestId = Math.floor(Math.random() * 1_000_000).toString();

    const humanLanguage = "en";

    const getParams = new URLSearchParams();
    getParams.set("rpcIds", rpcId);
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
    const envelopes = text.split(/\n\d+\n/).slice(1);
    const data = json.decode(
      (json.decode(envelopes[0]) as any)[0][2],
    ) as Proto;

    return {
      httpResponse,
      data,
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
    const nextPageToken = (response.data as any)[1] as string | undefined;
    const capturesData = (response.data as any)?.[0].filter((x: unknown) =>
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
    return ((response.data as any)[0] as Proto[][][]).map((proto) =>
      skuFromProto(proto[9])
    );
  }

  async fetchSku(skuId: string): Promise<models.Sku> {
    const response = await this.fetchRpc(
      "FWhQV",
      [null, skuId],
    );

    return skuFromProto((response.data as any)[16]);
  }

  async fetchGame(gameId: string): Promise<models.Game> {
    const response = await this.fetchRpc(
      "FWhQV",
      [gameId, null],
    );

    const proto = (response.data as any)[16];
    const sku = skuFromProto(proto);
    return {
      type: "game",
      proto,
      gameId,
      name: sku.name,
      skuId: sku.skuId,
    };
  }

  async fetchPlayer(
    playerId: string,
    includeStatus = true,
  ): Promise<models.Player> {
    const response = await this.fetchRpc(
      "D0Amud",
      [null, includeStatus, null, null, "4531298085847707355"],
    );

    return notImplemented();
  }

  async fetchPlayerFriends(playerId: string, includeStatus = true) {
    const response = await this.fetchRpc(
      "Z5HRnb",
      [null, includeStatus, playerId],
    );
  }

  async fetchPlayerGames(playerId: string, limit: number | null = null) {
    await this.fetchRpc("Q6jt8c", [null, 3, null, playerId]);
  }

  async fetchPlayerSearch(namePrefix: string) {
    namePrefix = z.string().min(2).max(20).parse(namePrefix);
    const q = namePrefix.slice(0, 1) + " " + namePrefix.slice(1);
    await this.fetchRpc("FdyJ0", [q]);
  }

  async fetchWhoAmI() {
    "esz4rb";
  }
}
