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

// deno-lint-ignore-file no-explicit-any

export const flags: FlagOpts = {
  string: "sqlite",
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
      "Player",
      "Game",
      "Sku",
    ] as const).map(async <Name extends keyof typeof defs>(name: Name) => {
      const table = db[name];
      const def = defs[name];

      const cacheControl = def.cacheControl ?? "max-age=5529600";

      const cacheAllowed = cacheControl !== "no-store,max-age=0";

      let cacheMaxAgeSeconds = cacheAllowed ? +Infinity : -Infinity;
      if (/^max-age=\d+$/.test(cacheControl)) {
        cacheMaxAgeSeconds = Number(cacheControl.split('=')[1]);
      }

      for (;;) {
        try {
          const next = table.first({
            orderBy: SQL`_lastUpdatedTimestamp asc, rowid asc`
          });

          if (next._lastUpdatedTimestamp && next._lastUpdatedTimestamp + cacheMaxAgeSeconds * 1000 >= Date.now()) {
            log.info(`All ${name} records are up-to-date.`);
            await sleep(Math.random() * 60 * 16);
          }

          const context = new DatabaseRequestContext(stadia);

          const requestBatch = await def.makeRequest(
            next.key as never,
            context,
          );
          const responseBatch = await client.fetchRpcBatch(requestBatch);
          const updated = await def.parseResponse(
            responseBatch.responses,
            next.key as never,
            context,
          );

          table.update({
            key: next.key,
            value: updated,
            _lastUpdatedTimestamp: context.requestTimestamp,
            _request: requestBatch as Array<Proto>,
            _response: responseBatch.responses,
          } as any);

          log.info(`Updated ${Deno.inspect(updated)}`);
        } catch (error) {
          log.error(`Error while updating ${name}: ${error}`);
          await sleep(Math.random() * 60 * 2);
        }
        await sleep(Math.random() * 60);
      }
    })
  );
};
