// deno-lint-ignore-file no-explicit-any

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
  boolean: "migrate",
  default: {
    sqlite: "./spider.sqlite",
  },
};

export const command = async (client: Client, flags: FlagArgs) => {
  const stadia = new StadiaDatabase(flags.sqlite);
  const db = stadia.database;
  const defs = stadia.tableDefinitions;

  return void await Promise.all(
    ([
      ...new Set(
        [
          "MyGames",
          // "MyPurchases",
          // "MyFriends",
          // "MyRecentPlayers",
          // "Player",
          "Game",
          // "Sku",
          // "StoreList",
          // "PlayerProgression",
          // "PlayerSearch",
          // "Capture",
          // ...Object.keys(defs),
        ],
      ) as Set<keyof typeof defs>,
    ]).map(async <Name extends keyof typeof defs>(name: Name, i: number) => {
      const table = db[name];
      const def = defs[name];

      const cacheControl = def.cacheControl ?? "max-age=5529600";

      const cacheAllowed = cacheControl !== "no-store,max-age=0";

      let cacheMaxAgeSeconds = cacheAllowed ? +Infinity : -Infinity;
      if (/^max-age=\d+$/.test(cacheControl)) {
        cacheMaxAgeSeconds = Number(cacheControl.split("=")[1]);
      }

      cacheMaxAgeSeconds = Math.max(60 * 4, cacheMaxAgeSeconds);

      for (;;) {
        sleep(i);

        try {
          const record = table.first({
            orderBy: SQL`
              _lastUpdateAttemptedTimestamp asc,
              _lastUpdatedTimestamp asc,
              rowId asc
            `,
          });

          if (
            record._lastUpdateAttemptedTimestamp &&
            record._lastUpdateAttemptedTimestamp + cacheMaxAgeSeconds * 1000 >=
              Date.now()
          ) {
            log.info(`All ${name} records are up-to-date.`);
            await sleep(Math.random() * 60 * 16);
            continue;
          }

          const context = new DatabaseRequestContext(stadia);

          record._lastUpdateAttemptedTimestamp = context.requestTimestamp;
          table.update(record as any);

          const requestBatch = await def.makeRequest(
            record.key as never,
            context,
          );
          const responseBatch = await client.fetchRpcBatch(requestBatch);
          const updatedValue = await def.parseResponse(
            responseBatch.responses,
            record.key as never,
            context,
          );

          if (cacheAllowed) {
            record.value = updatedValue;
            record._lastUpdatedTimestamp = context.requestTimestamp;
            record._request = requestBatch as Array<Proto>;
            record._response = responseBatch.responses;
            table.update(record as any);

            log.info(`Updated ${Deno.inspect(updatedValue)}`);
          } else {
            log.info(`Fetched non-cachable ${Deno.inspect(updatedValue)}`);
          }
        } catch (error) {
          log.error(`Error while updating ${name}: ${error}`);
          await sleep(Math.random() * 60);
        }
      }
    }),
  );
};
