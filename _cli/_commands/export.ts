/** Imports another database. */

// Import one table at a time
// import sorted by value null/not null, then by key, to increase
// the chance of similarity in adjacent pages to improve compression ratio
// Vacuum shouldn't be necessary, but if it is, do it.

import { Client } from "../../stadia.ts";
import { eprintln, print, println } from "../../_common/io.ts";
import { color, FlagArgs, FlagOpts, log } from "../../_deps.ts";
import * as json from "../../_common/json.ts";
import { ProtoMessage } from "../../_common/proto.ts";
import { StadiaDatabase } from "../../stadia/_database/mod.ts";
import SQL from "../../_common/sql.ts";
import { notImplemented } from "../../_common/assertions.ts";
import { sleep } from "../../_common/async.ts";

// deno-lint-ignore-file no-explicit-any

export const flags: FlagOpts = {
  boolean: ["json"],
};

export const skipSeeding = true;

export const command = async (client: Client, flags: FlagArgs) => {
  const sourceDatabase = client.database;
  const defs = client.database.tableDefinitions;

  const args = flags["_"] as Array<string>;
  const exportTarget = args[0] ??
    `${client.database.path.replace(/\.sqlite$/, "")}-${
      new Date().toISOString()
    }.sqlite`;

  const targetDatabase = new StadiaDatabase(exportTarget, true);

  sourceDatabase.database.sql(SQL`savepoint export_source`);
  targetDatabase.database.sql(SQL`savepoint export_target`);

  let i = 0;

  const timestamp = Date.now();

  for (
    const key of (["PlayerSearch"] ?? Object.keys(defs)) as Array<
      keyof typeof defs
    >
  ) {
    for (
      const row of sourceDatabase.database[key].select({
        unchecked: "unchecked",
      })
    ) {
      if (++i % 10000 === 0) {
        log.info(`${i} records exported, currently working through ${key}.`);
      }
      const value = row._response
        ? defs[key].parseResponse(row._response, row.key as never, {
          seed: () => {
            // NOT IMPLEMENTED!
            return Promise.resolve(false);
          },
          getDependency: () => notImplemented(),
          requestTimestamp: timestamp,
        })
        : undefined;
      try {
        targetDatabase.database[key].insert({
          key: row.key,
          value,
          _lastUpdateAttemptedTimestamp: row._lastUpdateAttemptedTimestamp,
          _lastUpdatedTimestamp: row._lastUpdatedTimestamp,
          _request: row._request,
          _response: row._response,
        } as any);
      } catch (error) {
        log.error(`failed to export ${key} ${row.key}: ${error.stack}`);
        log.error(Deno.inspect(row));
        await sleep(0.25);
      }
    }
  }

  sourceDatabase.database.sql(SQL`release export_source`);
  targetDatabase.database.sql(SQL`release export_target`);

  /*
  importing a record is to provide a key and optionally a request from which
  the value can be re-parsed with the current version.

  potential ordering for optimizing compression:

  - games
    - with values
      - sorted by name, then by gameId key
    - only keys
      - sorted by gameId key
  - skus
    - with values
      - sorted by gameId, then by type, then by name, then by skuId key
    - only keys
      - sorted by skuId key
  - subscriptions, sorted by key
  - captures, sorted by type, then by key
  etc

  but first just import at all.

  */
};
