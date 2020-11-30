import { flags } from "../../deps.ts";
import { Client } from "../../stadia/web_client/mod.ts";
import * as auth from "./auth.ts";
import * as fetch from "./fetch.ts";
import * as stadiaDotRun from "./stadia.run.ts";

const commands: Record<
  string,
  {
    flags: Partial<flags.ArgParsingOptions>;
    command: (client: Client, flags: flags.Args) => Promise<unknown>;
  }
> = { auth, fetch, "stadia.run": stadiaDotRun };

export default commands;
