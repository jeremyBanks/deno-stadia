import { flags } from "../../deps.ts";
import { Client } from "../../stadia/client.ts";
// import * as rpc from "./rpc.ts";
import * as spider from "./spider.ts";
// import * as stadiaDotRun from "./stadia.run/mod.ts";

const commands: Record<
  string,
  {
    flags: Partial<flags.ArgParsingOptions>;
    command: (client: Client, flags: flags.Args) => Promise<unknown>;
  }
> = { spider };

export default commands;
