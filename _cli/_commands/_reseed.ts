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

  // updates seed_keys.ts

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
  Game: [
    ${
    [
      ...new Set([
        ...[...db.tables.Game.select({
          orderBy: SQL`key asc`,
        })].map((p) => p.key),
      ]),
    ].map(json.encode).join(`,
    `)
  },
  ] as readonly GameId[],

  Sku: [
    ${
    [
      ...new Set([
        ...[...db.tables.Sku.select({
          orderBy: SQL`key asc`,
        })].map((p) => p.key),
      ]),
    ].map(json.encode).join(`,
    `)
  },
  ] as readonly SkuId[],

  Player: [
    ${
    [
      ...new Set([
        "956082794034380385",
        "5478196876050978967",
        "6820190109831870452",
        "12195660895651674916",
        ...[
          ...db.tables.Player.select({
            top: 512,
            orderBy: SQL`cast(key as float) asc`,
          }),
          ...[...db.tables.Player.select({
            top: 512,
            orderBy: SQL`cast(key as float) desc`,
          })].reverse(),
        ].map((p) => p.key),
      ]),
    ].map(json.encode).join(`,
    `)
  },
  ] as readonly PlayerId[],

  StoreList: [
    ${
    [
      ...new Set([
        3,
        ...[...db.tables.StoreList.select({
          orderBy: SQL`key asc`,
        })].map((p) => p.key),
      ]),
    ].map(json.encode).join(`,
    `)
  },
  ] as readonly StoreListId[],

  Subscription: [
    ${
    [
      ...new Set([
        ...[...db.tables.Subscription.select({
          orderBy: SQL`key asc`,
        })].map((p) => p.key),
      ]),
    ].map(json.encode).join(`,
    `)
  },
  ] as readonly SubscriptionId[],

  Capture: [
    ${
    seed_keys.Capture.map(json.encode).sort().join(`,
    `)
  },
  ] as readonly CaptureId[],

  PlayerSearch: [
    ${
    [
      ...new Set([
        // the most frequent full names
        ...[...db.sql(SQL`
          select
            lower(p.name) as frequentName,
            count(*) as playerCount
          from
            Player p
          where
            frequentName is not null
          group by
            frequentName
          order by
            playerCount desc
          limit
            128
        `)].map(([name, _count]) => name),

        // all two-character name prefixes, ordered by frequency
        ...[...db.sql(SQL`
          select
            substr(lower(p.name), 0, 3) as namePrefix,
            count(*) as prefixCount
          from
            Player p
          where
            namePrefix is not null
          group by
            namePrefix
          order by
            prefixCount desc
        `)].map(([prefix, _count]) => prefix),
        ...[
          ...[..."abcdefghijklmnopqrstuvwxyz"].flatMap((c) =>
            [..."abcdefghijklmnopqrstuvwxyz0123456789"].map((d) => c + d)
          ),
        ],
      ]),
    ].map(json.encode).join(`,
    `)
  },
  ] as readonly GamertagPrefix[],
} as const;
`);
};
