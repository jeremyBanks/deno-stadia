import { Client } from "../../stadia/client.ts";
import { eprintln, print, println } from "../../_common/io.ts";
import { color, FlagArgs, FlagOpts, sqlite, z } from "../../deps.ts";
import * as json from "../../_common/json.ts";
import { Json } from "../../_common/json.ts";
import { Proto } from "../../stadia/protos.ts";
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
};

const makeDB = (path: string) => {
  const db = new sqlite.DB(path);
};
