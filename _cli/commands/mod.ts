import { flags } from "../../deps.ts";
import { Client } from "../../stadia/web_client/mod.ts";
import * as auth from "./auth.ts";
import * as fetch from "./fetch.ts";
import * as html from "./html.ts";

const commands: Record<
  string,
  {
    flags: Partial<flags.ArgParsingOptions>;
    command: (client: Client, flags: flags.Args) => Promise<unknown>;
  }
> = { auth, fetch, html };

export default commands;
