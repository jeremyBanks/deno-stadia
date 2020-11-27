import {
  color,
  Database,
  flags,
  flags as stdFlags,
  log,
  SQL,
} from "../deps.ts";

import * as clui from "../_common/clui.ts";
import { eprint } from "../_common/io.ts";

import { discoverProfiles } from "../chrome/mod.ts";
import { Client } from "../stadia/web_client/views.ts";
import { GoogleCookies } from "../stadia/web_client/requests.ts";
import { notImplemented } from "../_common/assertions.ts";

import commands from "./commands/mod.ts";
import { makeClient } from "./authentication.ts";

const { yellow, italic, bold, cyan, red, brightRed, underline, dim } = color;

export const main = async (
  args: string[] = Deno.args,
  logLevel?: log.LevelName | null,
  self = "stadia",
) => {
  const usage = `\
${underline(`Unofficial ${brightRed(`Stadia`)} CLI`)} ${
    dim(`(https://deno.land/x/stadia)`)
  }

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
    in the current working directory. It may contain personal information such
    as your Google ID, your email address, and the list of games you own on
    Stadia, but it will never include any of your credentials, so you can share
    it without worrying about giving others access to your Google account.

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

    ${bold(`${self} debug fetch`)} ${yellow(`<stadia_url>`)}

        Fetches a Stadia URL and displays our internal representation of the
        response.

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

  const parseFlags = (
    args: string[],
    options?: Partial<flags.ArgParsingOptions>,
  ) =>
    stdFlags.parse(args, {
      stopEarly: true,
      unknown: (arg, key, value) => {
        if (key !== undefined) {
          eprint(red(`unknown argument: ${arg}\n\n`));
          eprint(usage);
          eprint(red(`unknown argument: ${arg}\n\n`));
          Deno.exit(64);
        }
      },
      ...options,
    });

  const rootFlags = parseFlags(args, {
    string: ["google-email", "google-cookie"],
    boolean: ["offline"],
  });

  const client = await makeClient(rootFlags);

  const [commandName, ...commandArgs] = rootFlags["_"].map(String);

  const commandMatch = commands[commandName];

  if (commandMatch) {
    const { command, flags: flagConfig } = commandMatch;
    const flags = parseFlags(commandArgs, flagConfig);
    await command(client, flags);
  } else {
    eprint(red(`unknown command: ${commandName}\n\n`));
    eprint(usage);
    Deno.exit(65);
  }
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
