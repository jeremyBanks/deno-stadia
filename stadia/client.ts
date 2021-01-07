import { assert, notImplemented } from "../_common/assertions.ts";
import { Json } from "../_common/json.ts";
import * as json from "../_common/json.ts";
import { eprintln, println } from "../_common/io.ts";
import * as protos from "./protos.ts";
import { Proto } from "./protos.ts";
import { safeEval } from "../_common/sandbox.ts";
import { log, z } from "../deps.ts";
import { throttled } from "../_common/async.ts";

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

    log.info(`${method} ${url} for Google user ${this.googleId}`);

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
    let ijValues: Json = {};
    let wizGlobalData: Json & (Record<string, Json>) = {};
    let afPreloadData: Record<
      string,
      Array<{
        arguments: Proto;
        value?: Proto;
        error?: Proto;
      }>
    > = {};

    if (httpResponse.status === 200) {
      const html = await httpResponse.text();

      wizGlobalData = await safeEval(
        "(" +
          (html.match(/WIZ_global_data =(.+?);<\/script>/s)
            ?.[1] ?? "null") +
          ")",
      ) as Record<string, Json>;

      ijValues = await safeEval(
        "(" +
          (html.match(/IJ_values =(.+?); window.IJ_valuesCb<\/script>/s)
            ?.[1] ?? "null") +
          ")",
      );

      assert(wizGlobalData instanceof Object);

      const preloadRequests = await safeEval(
        "(" +
          (html.match(
            /AF_dataServiceRequests =(.+?); var AF_initDataChunkQueue =/s,
          )
            ?.[1] ?? "null") +
          ")",
      ) as any;

      const preloadResponses = await Promise.all([
        ...html.matchAll(/>AF_initDataCallback(\(\{.*?\}\))\;<\/script>/gs),
      ].map((x: any) => {
        return safeEval(x[1]);
      }));

      afPreloadData = {};
      for (const response of preloadResponses as any) {
        const request = preloadRequests[response.key];
        (afPreloadData[request.id] ??= []).push({
          arguments: request.request,
          ...(!response.isError
            ? {
              value: response.data,
              error: undefined,
            }
            : {
              error: response.data,
              value: undefined,
            }),
        });
      }
    } else {
      error = {
        message: `non-200 http response status (${httpResponse.status})`,
      };
    }

    const response = {
      status: httpResponse.status,
      timestamp: Date.now(),
      error,
      ijValues,
      wizGlobalData,
      afPreloadData,
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

  async fetchStoreList(listId: number) {
    const response = await this.fetchRpc(
      "ZAm7We",
      [null, null, null, null, null, listId],
    );
    return ((response.data as any)[0] as Proto[][][]).map((proto) =>
      Sku.fromProto(proto[9])
    );
  }

  async fetchSku(skuId: string, gameId?: string): Promise<Sku> {
    const response = await this.fetchRpc(
      "FWhQV",
      [gameId ?? null, skuId],
    );

    return Sku.fromProto((response.data as any)[16]);
  }
}

abstract class ViewModel {
}

class Player extends ViewModel {
  constructor(
    readonly gamerId: string,
    readonly gamerName: string,
    readonly gamerNumber: string,
    readonly avatarId: number,
  ) {
    super();
  }

  get gamerTag() {
    return this.gamerNumber === "0000"
      ? this.gamerName
      : `${this.gamerName}#${this.gamerNumber}`;
  }

  static fromProto(proto_: Proto): Player {
    const proto = protos.Player.parse(proto_);
    const shallowUserInfo = proto[5];

    const gamerName = shallowUserInfo[0][0];

    const gamerNumber = shallowUserInfo[0][1];

    const avatarId = parseInt(shallowUserInfo[1][0].slice(1), 10);

    const gamerId = shallowUserInfo[5];

    return new Player(gamerId, gamerName, gamerNumber, avatarId);
  }
}

class Game extends ViewModel {
  static fromProto(proto: Proto): Game {
    return notImplemented();
  }
}

const skuTypeIds = {
  1: "game",
  2: "addon",
  3: "bundle",
  5: "bundle-subscription",
  6: "addon-subscription",
  10: "preorder",
};

class SkuWrapper extends ViewModel {
  protected constructor(
    readonly sku: Sku,
  ) {
    super();
  }

  static fromProto(proto: Array<Proto>): SkuWrapper {
    const sku = Sku.fromProto(proto[16] as Array<Proto>);

    return new SkuWrapper(sku);
  }
}

class Sku extends ViewModel {
  protected constructor(
    readonly typeId: number,
    readonly type: string,
    readonly skuId: string,
    readonly gameId: string | undefined,
    readonly name: string,
    readonly coverImageUrl: string,
    readonly description: string,
    readonly skuTimestampA: number | undefined,
    readonly skuTimestampB: number | undefined,
    readonly publisherOrganizationId: string,
    readonly developerOrganizationIds: string[],
    readonly languages: string[],
    readonly countries: string[],
    readonly internalName: string,
  ) {
    super();
  }

  static fromProto(proto: Array<any>): Sku {
    if (proto.length < 38) {
      proto.length = 38; // pad out optional trailing elements
    }
    const typeId = proto[6] as keyof typeof skuTypeIds;
    const type = skuTypeIds[typeId] || `-unknown-type-${typeId}`;
    const skuId = proto[0];
    const gameId = proto[4] ?? undefined;
    const name = proto[1];
    const description = proto[9];
    const languages = proto[24];
    const countries = proto[25];

    const coverImageUrl = (proto as any)[2][1][0][0][1]?.split(
      /=/,
    )[0] as string;
    const skuTimestampA = proto[10]?.[0] ?? undefined;
    const skuTimestampB = proto[26]?.[0] ?? undefined;

    const publisherOrganizationId = proto[15] as string;
    const developerOrganizationIds = proto[16] as string[];

    const internalName = proto[5] as string;

    return new Sku(
      typeId,
      type,
      skuId,
      gameId,
      name,
      coverImageUrl,
      description,
      skuTimestampA,
      skuTimestampB,
      publisherOrganizationId,
      developerOrganizationIds,
      languages,
      countries,
      internalName,
    );
  }
}
