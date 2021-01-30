import { flags } from "../../_deps.ts";
import { Client } from "../../stadia.ts";

import * as rpc from "./rpc.ts";
import * as spider from "./spider.ts";
import * as rebuildSeedKeys from "./_rebuild_seed_keys.ts";
import * as stadiaDotRun from "./_stadia.run/mod.ts";

const commands: Record<
  string,
  {
    flags: Partial<flags.ArgParsingOptions>;
    command: (client: Client, flags: flags.Args) => Promise<unknown>;
  }
> = {
  spider,
  rpc,
  "_rebuild_seed_keys": rebuildSeedKeys,
  "_stadia.run": stadiaDotRun,
};

export default commands;
