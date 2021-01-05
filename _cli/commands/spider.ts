import { Client } from "../../stadia/client.ts";
import { eprintln, print, println } from "../../_common/io.ts";
import { color, FlagArgs, FlagOpts, log, sqlite, z } from "../../deps.ts";
import * as json from "../../_common/json.ts";
import { Json } from "../../_common/json.ts";
import { Proto } from "../../stadia/protos.ts";
import * as protos from "../../stadia/protos.ts";
import * as models from "../../stadia/models.ts";
import { notImplemented, unreachable } from "../../_common/assertions.ts";
import { ZodSqliteMap } from "../../_common/zodmap.ts";

export const flags: FlagOpts = {
  string: "sqlite",
  default: {
    sqlite: "./stadia.sqlite",
  },
};

export const command = async (client: Client, flags: FlagArgs) => {
  const db = ZodSqliteMap.open(flags.sqlite);
  log.info(`opened db, ${db.size} entries`);

  db.set("hello", ["world"]);
  db.get("hello");

  log.info(`${db.size} entries`);
};
