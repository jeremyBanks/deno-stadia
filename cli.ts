import { color, Database, flags as stdFlags, log, SQL } from "./deps.ts";

import * as clui from "./_common/clui.ts";
import { eprint } from "./_common/io.ts";

import { discoverProfiles } from "./chrome/mod.ts";
import { Client } from "./stadia/web_client/views.ts";
import { GoogleCookies } from "./stadia/web_client/requests.ts";

const { yellow, italic, bold, cyan, red } = color;

export const main = async (
  args: string[] = Deno.args,
  logLevel?: log.LevelName | null,
  self = "stadia",
) => {
  const usage = `\
${cyan("USAGE:")}

    ${bold(self)} ${italic(`[${yellow("<authentication>")}]`)} ${
    bold("<command>")
  } ${italic(`[${yellow(`<arguments>...`)}]`)}

${cyan("AUTHENTICATION:")}

    You must authenticate with Google Stadia in one of the following ways:

    (1) If using Google Chrome on Windows 10 and running this command within
        Windows Subsystem for Linux, it will detect any Chrome Profiles that are
        synced with a Google account and load their authentication cookies
        automatically. If there are multiple synced profiles, you will be
        prompted to pick one, or you may specify it with the
        ${italic(`--google-email=${yellow(`<email>`)}`)} parameter.

    (2) The ${
    italic(`--google-cookie=${yellow(`<cookies>`)}`)
  } parameter may be set to a header-style
        semicolon-delimited Cookie string that will be used to authenticate with
        Google. This should contain the Google authentication cookies "SID",
        "SSID", and "HSID".

    (3) ${italic(`--offline`)} will disable all authentication and network
        operations. Operations that require data that isn't already saved
        locally will fail.

${cyan("LOCAL STATE:")}

    Local state is persisted in a SQLite database named "./deno-stadia.sqlite"
    in the current working directory. This may contain the Google ID and
    Google Email of the current user, but it will never include authentication
    credentials, so you can share it without compromising your Google account.

${cyan("COMMANDS:")}

    ${bold(`${self} auth`)}

        Prints information about the authenticated user.

    ${bold(`${self} run`)} ${yellow(`<game_name | game_id>`)}

        Launch a Stadia game in Chrome, specified by name or ID.

    ${bold(`${self} captures list`)}

        Lists captured images and video.

    ${bold(`${self} users profile`)} ${yellow(`<user_id>`)}

        Displays basic profile information for the user with the given ID.

    ${bold(`${self} store update`)}

        Updates the local Stadia store catalogue.

    ${bold(`${self} store search`)} ${yellow(`<name>`)}

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
      eprint(red(`unknown argument: ${arg}\n\n`));
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

  const database = new Database("./deno-stadia.sqlite");

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
