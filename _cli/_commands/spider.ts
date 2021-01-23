import { FlagArgs, FlagOpts, log } from "../../deps.ts";
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
import { Proto } from "../../_common/proto.ts";
import { sleep } from "../../_common/async.ts";

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

    }),
    (async () => {
      for (;;) {
        sleep(60);

        const game = db.Game.first({
          orderBy: SQL`_lastUpdatedTimestamp asc`,
        });

        const context = new DatabaseRequestContext(stadia, Infinity);
        const requestBatch = await defs.Game.makeRequest(
          game.key,
          context,
        );

        const responseBatch = await client.fetchRpcBatch(requestBatch);

        const updated = await defs.Game.parseResponse(
          responseBatch.responses,
          game.key,
        );

        db.Game.update({
          key: game.key,
          value: updated,
          _lastUpdatedTimestamp: context.requestTimestamp,
          _request: requestBatch as Array<Proto>,
          _response: responseBatch.responses,
        });

        let discovered = 0;
        for (const skuId of updated.skuIds) {
          if(db.Sku.insert({
            key: skuId,
          })) {
            discovered += 1;
          }
        }

        if (discovered) {
          log.info(`Discovered ${discovered} new Skus from Game ${game.key}`);
        }
      }
    })(),
  ]);
};
