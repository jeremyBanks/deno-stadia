export * from "./_types/models.ts";

// deno-lint-ignore-file no-explicit-any

import { Json } from "../_common/json.ts";
import * as json from "../_common/json.ts";
import { ProtoMessage } from "../_common/proto.ts";
import { safeEval } from "../_common/sandbox.ts";
import { log, z } from "../_deps.ts";
import { throttled } from "../_common/async.ts";
import { StadiaDatabase } from "./_database/mod.ts";

const fetch = throttled(Math.E, globalThis.fetch);

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
  readonly #googleCookies: GoogleCookies;
  public readonly database: StadiaDatabase;

  public constructor(
    googleId: string,
    googleCookies: GoogleCookies,
    sqlite: string = ":memory:",
    skipSeeding = false,
  ) {
    this.googleId = googleId;
    this.#googleCookies = googleCookies;
    this.database = new StadiaDatabase(sqlite, skipSeeding);
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

      "cookie": Object.entries(this.#googleCookies).map(([k, v]) =>
        `${k}=${v};`
      )
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

    log.debug(`${method} ${url} ${body} for Google user ${this.googleId}`);

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
    rpcidRequestPairs: Array<[string, ProtoMessage?]>,
  ) {
    // https://kovatch.medium.com/deciphering-google-batchexecute-74991e4e446c
    const rpcids = rpcidRequestPairs.map(([rpcid, _request]) => rpcid);

    const fReq = json.encode([
      rpcidRequestPairs.map(([rpcid, request], index) => {
        return [rpcid, json.encode(request ?? []), null, String(index + 1)];
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

    const responseEnvelopes = envelopes.filter((x: any) => x[0] === "wrb.fr")
      .sort(
        (a: any, b: any) => Number(a[6]) - Number(b[6]),
      );
    const responses = responseEnvelopes.map((r: any) =>
      json.decode(r[2])
    ) as Array<ProtoMessage>;
    log.debug(
      "RPC RESPONSE BATCH: " + Deno.inspect(responses, { iterableLimit: 4 }),
    );

    // XXX: are we incorrectly assuming these will come back in the same order?
    // look at user 11581666539686832029.

    return {
      httpResponse,
      responses,
    };
  }

  async fetchRpc(
    rpcId: string,
    request: ProtoMessage,
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
}
