import json from "../../_common/json.ts";
import { log, sqlite, z } from "../../deps.ts";

import {
  Client as ResponsesClient,
  JsProto,
  StadiaWebResponse,
} from "./_responses.ts";

const rpcUrl =
  "https://stadia.google.com/_/CloudcastPortalFeWebUi/data/batchexecute";

export class Client extends ResponsesClient {
  #rpcSourcePage?: ReturnType<ResponsesClient["fetchResponse"]>;

  async rpcSourcePageWizGlobalData() {
    this.#rpcSourcePage ??= this.fetchResponse("settings");
    return (await this.#rpcSourcePage).response.wizGlobalData as Record<
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
    request: JsProto,
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

    const url = new URL(rpcUrl);
    url.search = getParams.toString();

    const { httpResponse } = await this.fetchHttp(url.toString(), postParams);

    const text = await httpResponse.text();
    const envelopes = text.split(/\n\d+\n/).slice(1);
    const data = json.decode(
      (json.decode(envelopes[0]) as any)[0][2],
    ) as JsProto;

    return {
      httpResponse,
      data,
    };
  }

  async *fetchCaptures(pageToken: string | null = null): AsyncGenerator<{
    captureId: string;
    gameId: string;
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
    const capturesData = (response.data as any)?.[0].filter((x: unknown) => x instanceof Array);
    const captures =
      (capturesData as Array<any>).map((proto) => ({
        captureId: proto[1] as string,
        gameId: proto[2][0] as string,
        imageUrl: proto[7]?.[1] as string | undefined,
        videoUrl: proto[8]?.[1] as string | undefined,
      })) ?? [];

    log.debug(`Got page of ${captures.length} captures and a next page token ${nextPageToken}`);

    for (const capture of captures) {
      yield capture;
    }

    if (captures.length == pageSize) {
      yield* this.fetchCaptures(nextPageToken);
    }
  }
}
