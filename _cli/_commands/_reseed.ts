import { Client } from "../../stadia/client.ts";
import { eprintln, print, println } from "../../_common/io.ts";
import { color, FlagArgs, FlagOpts, log } from "../../deps.ts";

import seed_keys from "../../stadia/seed_keys.ts";
import { StadiaDatabase } from "../../stadia/database.ts";
import SQL from "../../_common/sql.ts";
import json from "../../_common/json.ts";

export const flags: FlagOpts = {
  string: "sqlite",
  default: {
    sqlite: "./spider.sqlite",
  },
};

export const command = async (client: Client, flags: FlagArgs) => {
  const stadia = new StadiaDatabase(flags.sqlite);
  const db = stadia.database;

  const userIds = (await Deno.readTextFile("../seed_ids.ignored/users.txt")).split(/\n/g).filter(Boolean);
  db.sql(SQL`begin deferred transaction`);
  let count = 0;
  for (const userId of userIds) {
    count += stadia.database.tables.Player.insert({key: userId}) ? 1 : 0;
  }
  log.debug(`Seeded ${count} players`)
  db.sql(SQL`commit transaction`);

  print(`\
import {
  CaptureId,
  GameId,
  GamertagPrefix,
  PlayerId,
  SkuId,
  StoreListId,
  SubscriptionId,
} from "./common_scalars.ts";

export default {
  Capture: [
    ${seed_keys.Capture.map(json.encode).sort().join(`,
    `)},
  ] as readonly CaptureId[],

  Game: [
    ${[...new Set([
      ...[...db.tables.Game.select({
        orderBy: SQL`key asc`
      })].map(p => p.key)
    ])].map(json.encode).join(`,
    `)},
  ] as readonly GameId[],

  Player: [
    ${[...new Set([
      "956082794034380385",
      "5478196876050978967",
      ...[...db.tables.Player.select({
          top: 512,
          orderBy: SQL`key asc`
        }), ...[...db.tables.Player.select({
          top: 512,
          orderBy: SQL`key desc`
        })].reverse()
      ].map(p => p.key)
    ])].map(json.encode).join(`,
    `)},
  ] as readonly PlayerId[],

  PlayerSearch: [
    ${
  /* TODO: the 128 most popular known player names, then an exhaustive list of
     all 26 * 36 two-character name prefixes, ordered by frequency. */
      seed_keys.PlayerSearch.map(json.encode).join(`,
    `)},
  ] as readonly GamertagPrefix[],

  Sku: [
    ${[...new Set([
      ...[...db.tables.Sku.select({
        orderBy: SQL`key asc`
      })].map(p => p.key)
    ])].map(json.encode).join(`,
    `)},
  ] as readonly SkuId[],

  StoreList: [
    ${[...new Set([
      3,
      ...[...db.tables.StoreList.select({
        orderBy: SQL`key asc`
      })].map(p => p.key)
    ])].map(json.encode).join(`,
    `)},
  ] as readonly StoreListId[],

  Subscription: [
    ${[...new Set([
      ...[...db.tables.Subscription.select({
        orderBy: SQL`key asc`
      })].map(p => p.key)
    ])].map(json.encode).join(`,
    `)},
  ] as readonly SubscriptionId[],
} as const;
`);
}
