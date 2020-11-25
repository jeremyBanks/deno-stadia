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
Unofficial Stadia CLI

${color.cyan("USAGE:")}

    ${color.bold(self)} ${
    color.italic(
      `[--google-email=${color.yellow(`<email>`)} | --google-cookies=${
        color.yellow(`<cookies>`)
      } | --offline]`,
    )
  } ${color.bold("<command>")} ${color.italic(`[${color.yellow(`<args>...`)}]`)}

${color.cyan("AUTHENTICATION:")}

    You must authenticate with Google Stadia in one of the following ways:

    The ${
    color.italic(`--google-cookie=`)
  } parameter may be set with a header-style semicolon-
    delimited Cookie string containing at least the three Google authentication
    cookies "SID", "SSID", and "HSID".

    If using Google Chrome on Windows 10 and running this command within
    Windows Subsystem for Linux, it will be able to automatically detect any
    Chrome Profiles that are synced with a Google account and load their
    authentication cookies for you. If there are multiple synced profiles, you
    may specify one to use with the ${
    color.italic(`--google-email=`)
  } parameter.

    You may specify ${color.italic(`--offline`)} to disable authentication, but
    any command that requires data that is not already saved locally will fail.

${color.cyan("COMMANDS:")}

    ${color.bold(`${self} auth`)}

        Prints information about the authenticated user.

    ${color.bold(`${self} run`)} ${color.yellow(`<game_name | game_id>`)}

        Launch a Stadia game in Chrome, specified by name or ID.

    ${color.bold(`${self} captures list`)}

        Lists captured images and video.

    ${color.bold(`${self} users profile`)} ${color.yellow(`<user_id>`)}

        Displays basic profile information for the user with the given ID.

    ${color.bold(`${self} store update`)}

        Updates the local Stadia store catalogue.

    ${color.bold(`${self} store search`)} ${color.yellow(`<name>`)}

        Search the local Stadia store catalogue.

`;

  if (logLevel !== null) {
    await initLogger(logLevel);
  }

  if (
    args.length === 0 ||
    (args.length === 1 &&
      ["-h", "--help", "help", "-?", "-help"].includes(args[0].toLowerCase()))
  ) {
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
