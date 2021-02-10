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
import {
  DatabaseRequestContext,
  StadiaDatabase,
} from "../../stadia/_database/mod.ts";
import SQL from "../../_common/sql.ts";
import { notImplemented } from "../../_common/assertions.ts";
import { sleep } from "../../_common/async.ts";

// deno-lint-ignore-file no-explicit-any

export const flags: FlagOpts = {};

export const skipSeeding = true;

export const command = async (client: Client, flags: FlagArgs) => {
  const sourceDatabase = client.database;
  const defs = client.database.tableDefinitions;

  const args = flags["_"] as Array<string>;
  const exportTarget = args[0] ??
    `${client.database.path.replace(/\.sqlite$/, "")}-${
      new Date().toISOString()
    }.sqlite`;

  const targetDatabase = new StadiaDatabase(":memory:", skipSeeding);

  sourceDatabase.database.sql(SQL`savepoint export_source`);
  targetDatabase.database.sql(SQL`savepoint export_target`);

  let i = 0;

  const context = new DatabaseRequestContext(targetDatabase);

  for (
    const modelName of (Object.keys(defs)) as Array<
      keyof typeof defs
    >
  ) {
    for (
      const row of sourceDatabase.database[modelName].select({
        unchecked: "unchecked",
      })
    ) {
      if (++i % 10000 === 0) {
        log.info(
          `${i} records exported, currently working through ${modelName}.`,
        );
      }
      const response = row._response;
      if (!response) {
        continue;
      }

      try {
        const value = defs[modelName].parseResponse(
          response,
          row.key as never,
          context,
        );

        targetDatabase.database[modelName].update({
          key: row.key,
          value,
          _lastUpdateAttemptedTimestamp: row._lastUpdateAttemptedTimestamp,
          _lastUpdatedTimestamp: row._lastUpdatedTimestamp,
          _request: row._request,
          _response: row._response,
        } as any);
      } catch (error) {
        log.error(`failed to insert ${modelName} ${row.key}: ${error.stack}`);
        log.error(Deno.inspect(row, {depth: 6}));
        await sleep(4.0);
      }
    }
  }

  sourceDatabase.database.sql(SQL`release export_source`);
  targetDatabase.database.sql(SQL`release export_target`);

  targetDatabase.database.sql(SQL`vacuum into ${exportTarget}`);
};
