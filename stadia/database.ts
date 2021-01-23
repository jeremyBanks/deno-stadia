/** Declares our Stadia tables with their associated RPCs. */

// deno-lint-ignore-file no-explicit-any

import { log, z } from "../deps.ts";
import * as zoddb from "../_common/zoddb.ts";
import { SQL } from "../_common/sql.ts";
import bigrams from "../_common/bigrams.ts";
import {
  as,
  assertStatic,
  AsyncCallback,
} from "../_common/utility_types/mod.ts";
import { assert, expect, notImplemented } from "../_common/assertions.ts";
import {
  GameId,
  PlayerId,
  PlayerName,
  PlayerNumber,
  SkuId,
  StoreListId,
} from "./common_scalars.ts";
import { ColumnDefinitions } from "../_common/zoddb.ts";
import { NoInfer } from "../_common/utility_types/mod.ts";
import { Proto, ProtoMessage } from "../_common/proto.ts";
import { skuFromProto } from "./response_parsers.ts";
import { Sku } from "./models.ts";

type Unbox<T extends z.ZodTypeAny> = NoInfer<
  z.infer<NoInfer<T>>
>;

export const def = <
  KeyType extends z.ZodType<string, z.ZodTypeDef, string>,
  ValueType extends z.ZodTypeAny,
  CacheControl extends `no-store,max-age=0` | `max-age=${string}` | undefined,
  ThisColumnDefinitions extends ColumnDefinitions,
>(definition: {
  keyType: KeyType;
  valueType: ValueType;
  columns: ThisColumnDefinitions;
  seedKeys?: Array<Unbox<KeyType>>;
  cacheControl?: CacheControl;
  makeRequest: (
    key: Unbox<KeyType>,
    context: RequestContext,
  ) => Array<[string, ProtoMessage?]> | Promise<Array<[string, ProtoMessage?]>>;
  parseResponse: (
    response: ProtoMessage,
    key: Unbox<KeyType>,
  ) => Unbox<ValueType>;
}) => {
  const rowType = z.object(
    {
      key: definition.keyType,
      value: definition.valueType.optional(),
      _request: ProtoMessage.optional(),
      _response: ProtoMessage.optional(),
      _lastUpdatedTimestamp: z.number().positive().optional(),
    } as const,
  );

  (definition.columns as any)["key"] = "unique";
  (definition.columns as any)["_lastUpdatedTimestamp"] = "indexed";

  const d = {
    ...definition,
    rowType,
  } as const;

  return d;
};

export class StadiaDatabase {
  constructor(
    readonly path: string,
  ) {}

  readonly tableDefinitions = tableDefinitions;
  readonly database = zoddb.open(this.path, this.tableDefinitions);
  readonly seeded = (() => {
    let count = 0;
    for (
      const tableName of Object.keys(
        tableDefinitions,
      ) as (keyof typeof tableDefinitions)[]
    ) {
      const definition = tableDefinitions[tableName];
      const table = this.database.tables[tableName];
      for (const key of (definition.seedKeys ?? [])) {
        if (
          table.insert({
            key: definition.keyType.parse(key) as any,
          } as any)
        ) {
          count += 1;
        }
      }
    }

    log.info(`Seeded ${count} records`);
  })();
}

abstract class RequestContext {
  /** Timestamp at which this request was initiated. */
  abstract requestTimestamp: number;
  /** Timestamp before which data will be considered stale/expired for the
  purposes of this request. */
  abstract minFreshTimestamp: number;

  abstract getDependency<
    DependencyKeyType extends z.ZodTypeAny,
    DependencyValueType extends z.ZodTypeAny,
  >(
    definition: {
      keyType: DependencyKeyType;
      valueType: DependencyValueType;
    },
    keyValue: Unbox<DependencyKeyType>,
  ): Promise<Unbox<DependencyValueType>>;
}

export class DatabaseRequestContext extends RequestContext {
  constructor(
    readonly database: StadiaDatabase,
    readonly maxAgeSeconds = Infinity,
  ) {
    super();
  }

  readonly requestTimestamp = Date.now();
  readonly minFreshTimestamp = this.requestTimestamp - this.maxAgeSeconds;

  async getDependency<
    DependencyKeyType extends z.ZodTypeAny,
    DependencyValueType extends z.ZodTypeAny,
  >(
    definition: {
      keyType: DependencyKeyType;
      valueType: DependencyValueType;
    },
    keyValue: Unbox<DependencyKeyType>,
  ): Promise<Unbox<DependencyValueType>> {
    return await notImplemented() ?? definition ?? keyValue;
  }
}

const tableDefinitions = (() => {
  const Player = def({
    cacheControl: "max-age=11059200",
    keyType: PlayerId,
    valueType: z.object({
      name: PlayerName,
      number: PlayerNumber,
      friendPlayerIds: z.array(PlayerId),
      playedGameIds: z.array(GameId),
    }),
    columns: {
      "value.name": "indexed",
      "value.number": "virtual",
    },
    makeRequest(playerId) {
      return [
        [
          "D0Amud",
          [null, true, null, null, playerId],
        ],
        [
          "Z5HRnb",
          [null, true, playerId],
        ],
        [
          "Q6jt8c",
          [null, null, null, playerId],
        ],
      ];
    },
    parseResponse: notImplemented,
    seedKeys: [
      "5478196876050978967",
      "956082794034380385",
      "5904879799764",
      "13541093767486303504",
    ],
  });

  const Game = def({
    cacheControl: "max-age=57600",
    keyType: GameId,
    valueType: z.object({
      skuId: SkuId,
      skuIds: z.array(SkuId),
    }),
    columns: {
      skuId: "indexed",
    },
    seedKeys: [
      // Destiny 2 (many associated skus)
      "20e792017ab34ad89b70dc17a5c72d68rcp1",
      // Celeste (no associated skus)
      "c911998e4f8d4c6ea6712c5ad33e4a54rcp1",
      // Wolfenstein German Version (unlisted in other countries)
      "6d92431b6ca24d69a771cf136a2a231frcp1",
      // Football Manager 2020 (delisted)
      "8a3cc52ad2334b1e91ded77bc43644e0rcp1",
      // Elder Scrolls Online (very many associated skus)
      "b17f16d4a4f94c0a85e07f54dbdedbb6rcp1",
    ],
    makeRequest: (gameId) => [
      ["ZAm7We", [gameId, [1, 2, 3, 4, 6, 7, 8, 9, 10]]],
      ["LrvzJb", [null, null, [[gameId]]]],
    ],
    parseResponse: (proto, gameId) => {
      const gameProto: Proto = (proto as any)[1][1][0][1][9];
      const gameSku = skuFromProto.parse(gameProto);

      const listedSkus: Array<Sku> | null = (proto as any)[0]?.[0]?.map((
        x: any,
      ) => skuFromProto.parse(x[9]));

      if (!listedSkus) {
        log.info(
          `No skus listed for ${gameSku.name} ${gameSku.gameId} ${gameSku.skuId}`,
        );
      }

      const skus = listedSkus ?? [gameSku];

      assert(gameId === gameSku.gameId);

      return {
        skuId: gameSku.skuId,
        skuIds: skus.map((sku) => sku.skuId),
      };
    },
  });

  const Sku = def({
    cacheControl: "max-age=1382400",
    keyType: SkuId,
    valueType: z.object({
      name: z.string(),
    }),
    columns: {
      "value.name": "indexed",
    },
    seedKeys: [
      // Stadia Pro (subscription)
      "59c8314ac82a456ba61d08988b15b550",
      // Ubisoft+ (subscription)
      "6ed658c7e6564de6acf724f979172bb6p",
      // RDR2 Launch Bundle (delisted)
      "2f112e5ba3d544d69bb1d537c5c4ae5c",
      // RDR2 Launch Bonus (delisted)
      "5ce9f4c1253047dda226a982fc3dc866",
      // FM2020 In-Game Editor (delisted)
      "69f80c302be14b8284ba84d1229848e8",
      // Immortals Preorder Bonus (delisted)
      "2e51be1b06974b81bcf0b4767b4c63dfp",
    ],
    makeRequest: (skuId) => [["FWhQV", [null, skuId]]],
    parseResponse: notImplemented,
  });

  const PlayerProgression = def({
    keyType: PlayerId,
    valueType: z.object({}),
    columns: {},
    cacheControl: "max-age=115200",
    seedKeys: Player.seedKeys,
    async makeRequest(playerId, context) {
      const player = await context.getDependency(Player, playerId);
      return player.playedGameIds.map((gameId) => [
        "e7h9qd",
        [null, gameId, playerId],
      ]);
    },
    parseResponse: notImplemented,
  });

  const StoreList = def({
    cacheControl: "max-age=1920",
    keyType: StoreListId,
    columns: {},
    valueType: z.object({
      name: z.string().nonempty(),
      skuIds: z.array(SkuId),
    }),
    seedKeys: ["3"],
    makeRequest: (listId) => [
      ["ZAm7We", [null, null, null, null, null, listId]],
    ],
    parseResponse: notImplemented,
  });

  const PlayerSearch = def({
    cacheControl: "max-age=5529600",
    keyType: z.string().min(2).max(20),
    valueType: z.array(PlayerId),
    columns: {},
    seedKeys: bigrams,
    makeRequest: (playerPrefix) => [
      ["FdyJ0", [playerPrefix.slice(0, 1) + " " + playerPrefix.slice(1)]],
    ],
    parseResponse: notImplemented,
  });

  const MyGames = def({
    cacheControl: "max-age=172800",
    keyType: z.literal("myGames"),
    valueType: z.array(GameId),
    columns: {},
    seedKeys: [],
    makeRequest: () => [["T2ZnGf"]],
    parseResponse: notImplemented,
  });

  const MyFriends = def({
    cacheControl: "no-store,max-age=0",
    keyType: z.literal("myFriends"),
    valueType: z.array(PlayerId),
    columns: {},
    seedKeys: [],
    makeRequest: () => [["Z5HRnb"]],
    parseResponse: notImplemented,
  });

  const MyPurchases = def({
    cacheControl: "no-store,max-age=0",
    keyType: z.literal("myPurchases"),
    valueType: z.array(SkuId),
    columns: {},
    seedKeys: [],
    makeRequest: () => [["uwn0Ob"]],
    parseResponse: notImplemented,
  });

  const defs = {
    Player,
    Game,
    Sku,
    StoreList,
    PlayerProgression,
    PlayerSearch,
    MyGames,
    MyPurchases,
    MyFriends,
  } as const;

  assertStatic as as.StrictlyExtends<typeof defs, zoddb.TableDefinitions>;

  return defs;
})();
