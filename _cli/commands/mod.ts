import { flags } from "../../deps.ts";
import { Client } from "../../stadia/web_client/views.ts";
import * as auth from "./auth.ts";
import * as captures from "./captures.ts";
import * as friends from "./friends.ts";
import * as profile from "./profile.ts";
import * as run from "./run.ts";
import * as store from "./store.ts";

const commands: Record<
  string,
  {
    flags: Partial<flags.ArgParsingOptions>;
    command: (client: Client, flags: flags.Args) => Promise<unknown>;
  }
> = { auth, captures, friends, profile, run, store };

export default commands;
