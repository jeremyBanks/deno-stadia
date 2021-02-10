import { color, flags, flags as stdFlags, log } from "../_deps.ts";

import { eprint, eprintln } from "../_common/io.ts";
import commands from "./_commands/mod.ts";
import { makeClient } from "./_authentication.ts";

const { yellow, italic, bold, cyan, red, underline, dim } = color;

export const main = async (
  args: string[] = Deno.args,
  logLevel?: log.LevelName | null,
  self = "stadia",
) => {
  const usage = `\
${underline(`Unofficial Stadia CLI`)}

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

${cyan("COMMANDS:")}

    ${bold(`${self} auth`)}

        Prints information about the authenticated user.

    ${bold(`${self} fetch`)} ${italic(`[--json]`)} ${yellow(`<stadia_url>`)}

        Fetches a Stadia URL and displays our internal representation of the
        response. The default output is meant for humans. The ${
    italic(`[--json]`)
  } flag
        adds more detail for machines.

        ${bold(`${self} rpc method_id [...json_args]`)}

        ${bold(`${self} captures`)}
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
    string: ["google-email", "google-cookie", "sqlite"],
    boolean: ["offline"],
    default: {
      sqlite: "./stadia.sqlite",
    },
  });

  const [commandName, ...commandArgs] = rootFlags["_"].map(String);

  const commandMatch = commands[commandName];

  if (commandMatch) {
    const client = await makeClient(
      rootFlags,
      commandMatch.skipSeeding ?? false,
    );

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
      console: new class extends log.handlers.ConsoleHandler {
        constructor() {
          super("DEBUG");
        }
        log(msg: string): void {
          eprintln(msg);
        }
      }(),
    },
    loggers: {
      default: {
        level: logLevel,
        handlers: ["console"],
      },
    },
  });
};
