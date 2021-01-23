import { FlagArgs, FlagOpts } from "../../deps.ts";
import {
  DatabaseRequestContext,
  StadiaDatabase,
} from "../../stadia/database.ts";
import { z } from "../../deps.ts";
import { as, assertStatic } from "../../_common/utility_types/mod.ts";
import { eprintln } from "../../_common/io.ts";
import { PlayerId } from "../../stadia/common_scalars.ts";
import { SQL } from "../../_common/sql.ts";
import { Client } from "../../stadia/client.ts";

export const flags: FlagOpts = {
  string: "sqlite",
  default: {
    sqlite: "./spider.sqlite",
  },
};

export const command = async (client: Client, flags: FlagArgs) => {
  // TODO: manually do this then shove it in StadiaDatabase

  const stadia = new StadiaDatabase(flags.sqlite);
  const db = stadia.database;
  const defs = stadia.tableDefinitions;

  return void await Promise.all([
    (async () => {
      while ("spider players") {
        const player = db.Player.first({
          orderBy: SQL`_lastUpdatedTimestamp asc`,
        });

        const context = new DatabaseRequestContext(stadia, Infinity);
        const requestBatch = await defs.Player.makeRequest(
          player.key,
          context,
        );

        const responseBatch = await client.fetchRpcBatch(requestBatch);

        const parsed = await defs.Player.parseResponse(
          responseBatch.responses,
          player.key,
        );

        console.log(parsed);

        return;
      }
    })(),
  ]);
};
