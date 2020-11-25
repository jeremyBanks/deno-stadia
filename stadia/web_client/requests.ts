/** Stadia web site client. */
import { Database, log, SQL } from "../../deps.ts";

import { throttled } from "../../_common/async.ts";

const minRequestIntervalSeconds = 69 / 42;
const fetch = throttled(minRequestIntervalSeconds, globalThis.fetch);

const stadiaRoot = new URL("https://stadia.google.com/");

export const StadiaWebRequest = SQL`StadiaWebRequest`;

export const schema = SQL`
  create table if not exists StadiaWebRequest (
    [requestId] integer primary key,
    [request] json text
  );
`;

export interface StadiaWebRequest {
  /** Local ID for this request. */
  requestId: bigint;
  /** Google ID of account whose credentials were used for this request */
  googleId: string;
  /** Requested path, relative to https://stadia.google.com/ */
  path: string;
  /** Timestamp at which the request was completely sent */
  timestamp: number;
}

type NewStadiaWebRequest = Omit<StadiaWebRequest, "requestId">;

export type GoogleCookies = {
  readonly SID: string;
  readonly SSID: string;
  readonly HSID: string;
};

export class Client {
  public readonly googleId: string;
  private readonly googleCookies: GoogleCookies;
  protected readonly database: Promise<Database>;

  public constructor(
    googleId: string,
    googleCookies: GoogleCookies,
    database: Database = new Database(),
  ) {
    this.googleId = googleId;
    this.googleCookies = googleCookies;
    this.database = this.initializeDatabase(database).then(() => database);
  }

  /** Performs any database initialization required for this class. */
  protected async initializeDatabase(database: Database): Promise<void> {
    await database.query(schema);
  }

  public async fetchHttp(path: string) {
    const url = new URL(path, stadiaRoot);
    if (url.origin !== stadiaRoot.origin) {
      // Don't accidentally send Google cookies to the wrong host.
      throw new TypeError(`${url} is not in ${stadiaRoot}`);
    }

    const headers = {
      "user-agent": [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "AppleWebKit/537.36 (KHTML, like Gecko)",
        "Chrome/86.0.4240.198",
        "Safari/537.36",
      ].join(" "),

      "cookie": Object.entries(this.googleCookies).map(([k, v]) => `${k}=${v};`)
        .join(" "),
    };

    const insertValue: NewStadiaWebRequest = {
      googleId: this.googleId,
      timestamp: Date.now(),
      path,
    };

    // XXX: lock database or eliminate async operations
    await (await this.database).query(
      SQL`insert into ${StadiaWebRequest}(request) values (${insertValue});`,
    );
    const [row] = await (await this.database).query(
      SQL`select * from ${StadiaWebRequest} order by requestId desc limit 1`,
    ) as unknown as any;

    const request = {
      requestId: row.requestId,
      ...JSON.parse(row.request as string),
    } as StadiaWebRequest;

    log.debug(`fetching ${url} for ${this.googleId}`);
    const httpResponse = await fetch(url, { headers });

    return { request, httpResponse };
  }
}
