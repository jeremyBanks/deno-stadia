#!/usr/bin/env -S deno run --allow-read=/ --allow-write=/ --allow-net=stadia.google.com --allow-run
import * as log from "https://deno.land/std@0.78.0/log/mod.ts";
import SQL, { Database } from "https://deno.land/x/lite@0.0.9/sql.ts";

import * as clui from "./_common/clui.ts";

import { discoverProfiles } from "./chrome/mod.ts";
import { Client } from "./stadia/web_client/views.ts";
import { GoogleCookies } from "./stadia/web_client/requests.ts";

let logLevel: log.LevelName;
try {
  // If we have permission to check log level, default to INFO.
  logLevel = Deno.env.get("DENO_STADIA_LOG_LEVEL") as log.LevelName || "INFO";
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
  ) as GoogleCookies;

  if (Object.keys(googleCookies).length < 3) {
    log.debug(`${chromeProfile} does not have Google authentication cookies.`);
    continue;
  }

  stadiaProfiles.push({
    googleId: chromeProfile.googleId,
    googleCookies,
    chromeProfile,
  });
}

log.info(
  `Discovered ${stadiaProfiles.length} Chrome profiles with Stadia cookies.`,
);

const choices = stadiaProfiles.map((profile) => ({
  profile,
  toString() {
    return [
      profile.chromeProfile.googleName,
      `<${profile.chromeProfile.googleEmail}>`,
    ].join(" ");
  },
}));

const profile = (await clui.choose(choices, choices[0])).profile;

const database = new Database("./data.sqlite");

const client = new Client(profile.googleId!, profile.googleCookies, database);

console.log(await client.fetchView("/profile"));
