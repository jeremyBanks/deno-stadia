/** Requests and responses for Stadia pages. */
import { Database, SQL } from "../../deps.ts";
import { assert } from "../../_common/assertions.ts";
import { safeEval } from "../../_common/sandbox.ts";
import { Json } from "../../_common/types.ts";

import { Client as RequestsClient, StadiaWebRequest } from "./requests.ts";

type StadiaWebResponse = {
  requestId: bigint;
  /** Timestamp at which the response was completely received */
  timestamp: number;
  /** Column will be null if request is successful, else it will contain an
    * error object. There will always be an error object if status !== 200,
    * but even if status === 200, you must check this field for possible errors.
    */
  error: Json;
  /** HTTP status code of response */
  status: number;
  /** The initial value of `window.IJ_values` in the document */
  ijValues: Json;
  /** The initial value of `window.WIZ_global_data` in the document */
  wizGlobalData: Json;
  /** Collects `AF_dataServiceRequests` entries and `AF_initDataCallbacks`
    * calls in the document by RPC method ID. */
  afPreloadData:
    | null
    | Record<
      string,
      Array<
        & {
          arguments: JsProtoArray;
        }
        & (
          | { value: JsProtoArray; error: void }
          | { error: JsProtoArray; value: void }
        )
      >
    >;
};

export class Client extends RequestsClient {
  protected async initializeDatabase(database: Database) {
    await super.initializeDatabase(database);
  }

  public async fetchResponse(path: string) {
    const { request, httpResponse } = await super.fetchHttp(path);

    let error: Json = null;
    let ijValues: Json = null;
    let wizGlobalData: Json & (null | Record<string, Json>) = null;
    let afPreloadData: StadiaWebResponse["afPreloadData"] = null;

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
}

export type JsProtoArray = null | number | string | boolean | JsProtoArray[];
