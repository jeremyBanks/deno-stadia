/** Requests and responses for Stadia pages. */
import { SQL, Database } from "../../deps.ts";
import { assert } from "../../_common/assertions.ts";
import { safeEval } from "../../_common/sandbox.ts";
import { Json } from "../../_common/types.ts";

import { Client as RequestsClient, StadiaWebRequest } from "./requests.ts";

export const StadiaWebResponse = SQL`StadiaWebResponse`;

export const schema = SQL`
  create table if not exists ${StadiaWebResponse} (
    [requestId] integer primary key references ${StadiaWebRequest}(requestId),
    [response] brotli json blob
  );
`;

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
    await database.query(schema);
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

    const insertValue: StadiaWebResponse = {
      requestId: request.requestId,
      status: httpResponse.status,
      timestamp: Date.now(),
      error,
      ijValues,
      wizGlobalData,
      afPreloadData,
    };

    // XXX: lock database or eliminate async operations
    await (await this.database).query(
      SQL
        `insert into ${StadiaWebResponse}(requestId, response) values (${insertValue.requestId}, ${insertValue as any});`,
    );
    const [row] = await (await this.database).query(
      SQL`select * from ${StadiaWebResponse} order by requestId desc limit 1`,
    );
    const response = {
      requestId: row.requestId,
      ...JSON.parse(row.response as string),
    } as StadiaWebResponse;
    return { request, httpResponse, response };
  }
}

export type JsProtoArray = null | number | string | boolean | JsProtoArray[];
