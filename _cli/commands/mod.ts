import { flags } from "../../deps.ts";
import { Client } from "../../stadia/web_client/mod.ts";
import * as auth from "./auth.ts";
import * as captures from "./captures.ts";
import * as fetch from "./fetch.ts";
import * as rpc from "./rpc.ts";
import * as stadiaDotRun from "./stadia.run/mod.ts";

const commands: Record<
  string,
  {
    flags: Partial<flags.ArgParsingOptions>;
    command: (client: Client, flags: flags.Args) => Promise<unknown>;
  }
> = { auth, captures, fetch, rpc, "stadia.run": stadiaDotRun };

export default commands;
