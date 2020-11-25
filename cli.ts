import { color, Database, flags as stdFlags, log, SQL } from "./deps.ts";

import * as clui from "./_common/clui.ts";
import { eprint } from "./_common/io.ts";

import { discoverProfiles } from "./chrome/mod.ts";
import { Client } from "./stadia/web_client/views.ts";
import { GoogleCookies } from "./stadia/web_client/requests.ts";

export const main = async (
  args: string[] = Deno.args,
  logLevel?: log.LevelName | null,
  self = "stadia",
) => {
  const usage = `\
usage: ${self} [--d] <command> [<args>]
`;

  if (logLevel !== null) {
    await initLogger(logLevel);
  }

  if (args.length === 0) {
    eprint(usage);
    Deno.exit(0);
  }

  const rootFlags = stdFlags.parse(args, {
    stopEarly: true,
    unknown: (arg: string) => {
      eprint(color.red(`unknown argument: ${arg}\n\n`));
      eprint(usage);
      Deno.exit(64);
    },
  });

  const command = rootFlags["_"];

  await doThings();
};

const doThings = async () => {
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
      log.debug(
        `${chromeProfile} does not have Google authentication cookies.`,
      );
      continue;
    }

    stadiaProfiles.push({
      googleId: chromeProfile.googleId,
      googleCookies,
      chromeProfile,
    });
  }

  log.info(
    `Discovered ${stadiaProfiles.length} synched Chrome profiles with Stadia cookies.`,
  );

  const choices = stadiaProfiles.map((profile) => ({
    profile,
    toString() {
      return [
        profile.chromeProfile.name,
        `<${profile.chromeProfile.googleEmail}>`,
      ].join(" ");
    },
  }));

  const profile = (await clui.choose(choices, choices[0])).profile;

  const database = new Database("./data.sqlite");

  const client = new Client(profile.googleId!, profile.googleCookies, database);

  console.log(await client.fetchView("/profile"));
};

const initLogger = async (logLevel?: log.LevelName) => {
  if (logLevel === undefined) {
    try {
      // If we have permission to check log level, default to INFO.
      logLevel =
        Deno.env.get("DENO_STADIA_LOG_LEVEL")?.toUpperCase() as log.LevelName ||
        "INFO";
    } catch {
      // If we don't have permission to check, include everything.
      logLevel = "DEBUG";
    }
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
};
