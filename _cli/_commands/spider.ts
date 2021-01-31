// deno-lint-ignore-file no-explicit-any

import { FlagArgs, FlagOpts, log, z } from "../../_deps.ts";
import {
  DatabaseRequestContext,
  StadiaDatabase,
} from "../../stadia/_database/mod.ts";
import { SQL } from "../../_common/sql.ts";
import { Client } from "../../stadia.ts";
import { ProtoMessage } from "../../_common/proto.ts";
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
          "Player",
          // "Game",
          // "Sku",
          // "StoreList",
          // "PlayerProgression",
          "PlayerSearch",
          // "MyGames",
          // "MyPurchases",
          // "MyFriends",
          // "MyRecentPlayers",
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

      cacheMaxAgeSeconds = Math.max(60 * 60 * 24 * 7, cacheMaxAgeSeconds);

      for (;;) {
        try {
          db.sql(SQL`commit transaction`);
        } catch (error) {
          error;
        }
        db.sql(SQL`begin deferred transaction`);
        sleep(i);

        log.debug(`Known ${name}: ${table.count()}`);
        log.debug(
          `Loaded ${name}: ${
            table.count({ where: SQL`_lastUpdatedTimestamp is not null` })
          }`,
        );

        const record = table.first({
          orderBy: SQL`
            _lastUpdateAttemptedTimestamp asc,
            _lastUpdatedTimestamp asc,
            length(key) asc,
            rowId desc
          `,
        });

        try {
          const context = new DatabaseRequestContext(stadia);

          if (
            record._lastUpdateAttemptedTimestamp &&
            record._lastUpdateAttemptedTimestamp + cacheMaxAgeSeconds * 1000 >=
              context.requestTimestamp
          ) {
            log.info(`All ${name} records are up-to-date.`);
            try {
              db.sql(SQL`commit transaction`);
            } catch (error) {
              error;
            }
            await sleep(Math.random() * 60 * 16);
            continue;
          }

          log.info(`Spidering ${name} ${record.key}`);

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
            record._request = z.array(ProtoMessage).parse(requestBatch);
            record._response = responseBatch.responses;
            table.update(record as any);

            log.debug(
              `Updated ${Deno.inspect(updatedValue)}, ${name} ${record.key}`,
            );
          } else {
            log.debug(
              `Fetched non-cachable ${
                Deno.inspect(updatedValue)
              }, ${name} ${record.key}`,
            );
          }
        } catch (error) {
          log.error(
            `Error while updating ${name} ${record.key}: ${error.stack ??
              error}`,
          );
          await sleep(Math.random() * 60);
        }
      }
    }),
  );
};
