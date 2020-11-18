#!/usr/bin/env -S deno run --allow-read=/ --allow-write=/ --allow-net=stadia.google.com --allow-run
import * as log from "https://deno.land/std@0.78.0/log/mod.ts";
import { assert } from "https://deno.land/std@0.78.0/testing/asserts.ts";

import { discoverProfiles } from "./chrome/mod.ts";
import { throttled } from "./_util.ts";

let logLevel: log.LevelName;
try {
  // If we have permission to check log level, default to INFO.
  logLevel = Deno.env.get("DENO_LOG") as log.LevelName || "INFO";
} catch {
  // If we don't have permission to check, include everything.
  logLevel = "DEBUG";
}

await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG"),
  },
  loggers: {
    default: {
      level: logLevel,
      handlers: ["console"],
    },
  },
});

const fetch = throttled(420 / 69, globalThis.fetch);

const chromeProfiles = await discoverProfiles();

log.debug(`Discovered ${chromeProfiles.length} Chrome profiles.`);

const stadiaProfiles = [];

for (const chromeProfile of chromeProfiles) {
  const cookies = await chromeProfile.cookies();
  const hasStadiaCookies = undefined !== cookies.find((c) =>
    c.host === ".stadia.google.com"
  );

  if (!hasStadiaCookies) {
    log.debug(`${chromeProfile} has no Stadia cookies.`);
    continue;
  }

  const googleCookies = Object.fromEntries(
    cookies.filter((c) => c.host === ".google.com").flatMap((c) =>
      ["SID", "SSID", "HSID"].includes(c.name) ? [[c.name, c.value]] : []
    ),
  );

  if (Object.keys(googleCookies).length < 3) {
    log.debug(`${chromeProfile} does not have Google authentication cookies.`);
    continue;
  }

  const headers = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
    "cookie": Object.entries(googleCookies).map((c) => c.join("=")).join("; "),
  };

  const fetchStadia = async (path: string) => {
    log.debug(`Fetching ${path} from Stadia.`);
    const response = await fetch(
      `https://stadia.google.com/${path}`,
      { headers },
    );

    if (!response.ok) {
      throw new Error(`Stadia request status ${response.status}`);
    }

    const body = await response.text();

    const globalData: Record<string, unknown> = eval(
      "(" +
        (body.match(/WIZ_global_data =(.+?);<\/script>/s)
          ?.[1] ?? "null") +
        ")",
    );
    assert(globalData instanceof Object);

    const preloadRequests = eval(
      "(" +
        (body.match(
          /AF_dataServiceRequests =(.+?); var AF_initDataChunkQueue =/s,
        )
          ?.[1] ?? "null") +
        ")",
    );

    const preloadResponses = [
      ...body.matchAll(/>AF_initDataCallback(\(\{.*?\}\))\;<\/script>/gs),
    ].map((x: any) => {
      return eval(x[1]);
    });

    const preloadedData = [];
    for (const response of preloadResponses) {
      const request = preloadRequests[response.key];
      preloadedData.push({
        id: request.id,
        args: request.request,
        isError: response.isError,
        data: response.data,
      });
    }

    return {
      body,
      globalData,
      preloadedData,
    };
  };

  const { globalData, preloadedData } = await fetchStadia("profile");

  const stadiaGoogleId = globalData?.["W3Yyqf"];

  if (stadiaGoogleId !== chromeProfile.googleId) {
    log.warning(
      `Chrome chromeProfile ${chromeProfile} had Google ID ${chromeProfile.googleId} but Stadia was logged in to Google ID ${stadiaGoogleId}`,
    );
    continue;
  }

  const userInfo = preloadedData.find(({ id }) => id === "D0Amud")?.data;
  assert(userInfo instanceof Array);

  const shallowUserInfo = userInfo?.[5];
  assert(shallowUserInfo instanceof Array);

  const gamerTagName = shallowUserInfo?.[0]?.[0];
  assert(gamerTagName && typeof gamerTagName === "string");

  const gamerTagNumber = shallowUserInfo?.[0]?.[1];
  assert(gamerTagNumber && typeof gamerTagNumber === "string");

  const gamerTag = gamerTagNumber === "0000"
    ? gamerTagName
    : `${gamerTagName}#${gamerTagNumber}`;

  const avatarId = parseInt(shallowUserInfo?.[1]?.[0]?.slice(1), 10);
  assert(Number.isSafeInteger(avatarId));

  const avatarUrl = shallowUserInfo?.[1]?.[1];
  assert(avatarUrl && typeof avatarUrl === "string");

  const gamerId = shallowUserInfo?.[5];
  assert(gamerId && typeof gamerId === "string");

  const stadiaProfile = {
    gamerId,
    gamerTag,
    gamerTagName,
    gamerTagNumber,
    avatarId,
    avatarUrl,
    chromeProfile,
  };

  log.info(
    `${chromeProfile.googleEmail} is logged in to Stadia as ${gamerTag}.`,
  );

  stadiaProfiles.push(stadiaProfile);
}

console.log(stadiaProfiles);
