import { Client } from "../../stadia.ts";
import { eprintln, print, println } from "../../_common/io.ts";
import { color, FlagArgs, FlagOpts, log } from "../../_deps.ts";

import seed_keys from "../../stadia/_seed/keys.ts";
import { StadiaDatabase } from "../../stadia/_database/mod.ts";
import SQL from "../../_common/sql.ts";
import json from "../../_common/json.ts";

export const flags: FlagOpts = {
  string: "sqlite",
  default: {
    sqlite: "./spider.sqlite",
  },
};

export const command = async (client: Client, flags: FlagArgs) => {
  const db = client.database.database;

  print(`\
import {
  CaptureId,
  GameId,
  GamertagPrefix,
  PlayerId,
  SkuId,
  StoreListId,
  SubscriptionId,
} from "../_types/common_scalars.ts";

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
        ...[...db.tables.Player.select({
          limit: 512,
          orderBy: SQL`cast(key as float) asc`,
        })].map((p) => p.key),
        ...[...db.tables.Player.select({
          where: SQL`length(key) = 17`,
          limit: 1,
          orderBy: SQL`cast(key as float) desc`,
        })].map((p) => p.key),
        "956082794034380385",
        "5478196876050978967",
        ...[...db.tables.Player.select({
          limit: 509,
          orderBy: SQL`cast(key as float) desc`,
        })].reverse().map((p) => p.key),
      ]),
    ].map(json.encode).join(`,
    `)
  },
  ] as readonly PlayerId[],

  StoreList: [
    ${
    [...seed_keys.StoreList].sort((a, b) => a - b).map(json.encode).join(`,
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
    [...seed_keys.Capture].sort().map(json.encode).join(`,
    `)
  },
  ] as readonly CaptureId[],

  PlayerSearch: [
    ${
    [
      // TODO: also include the most popular name for each avatar

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

        ...[15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3].flatMap((size) =>
          [...db.sql(SQL`
          select
            substr(lower(p.name), 0, ${size + 1}) as namePrefix,
            count(*) as prefixCount
          from
            Player p
          where
            namePrefix is not null
            and length(p.name) >= ${size}
          group by
            namePrefix
          order by
            prefixCount desc
          limit
            8
        `)].map(([name, _count]) => name)
        ),

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
          ...[..."abcdefghijklmnopqrstuvwxyz0123456789"].flatMap((c) =>
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
