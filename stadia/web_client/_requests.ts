/** Stadia web site client. */
import { log, sqlite, z } from "../../deps.ts";

import { throttled } from "../../_common/async.ts";

const minRequestIntervalSeconds = 420 / 69;
const fetch = throttled(minRequestIntervalSeconds, globalThis.fetch);

const stadiaRoot = new URL("https://stadia.google.com/");
const allowedRoots = [
  stadiaRoot,
  new URL("https://lh3.googleusercontent.com/"),
];

export const StadiaWebRequest = z.object({
  /** Local ID for this request. */
  requestId: z.bigint(),
  /** Google ID of account whose credentials were used for this request */
  googleId: z.string(),
  /** Requested path, relative to https://stadia.google.com/ */
  path: z.string(),
  /** Timestamp at which the request was completely sent */
  timestamp: z.number(),
});
export type StadiaWebRequest = z.infer<typeof StadiaWebRequest>;

export const NewStadiaWebRequest = StadiaWebRequest.omit({ requestId: true });
export type NewStadiaWebRequest = z.infer<typeof NewStadiaWebRequest>;

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
  protected readonly database: sqlite.DB;

  public constructor(
    googleId: string,
    googleCookies: GoogleCookies,
    database = new sqlite.DB(),
  ) {
    this.googleId = googleId;
    this.googleCookies = googleCookies;
    this.database = database;
    this.initializeDatabase();
  }

  /** Performs any database initialization required for this class. */
  protected initializeDatabase() {
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

    const request = NewStadiaWebRequest.parse({
      googleId: this.googleId,
      timestamp: Date.now(),
      path: url.pathname,
    });

    log.debug(`${method} ${url} for Google user ${this.googleId}`);

    const httpResponse = await fetch(url, { headers, body, method });

    if (httpResponse.status !== 200) {
      throw new Error(
        `http status ${httpResponse.status} ${httpResponse.statusText}`,
      );
    }

    return { request, httpResponse };
  }
}
