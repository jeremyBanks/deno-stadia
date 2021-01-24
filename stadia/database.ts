/** Declares our Stadia tables with their associated RPCs. */

// deno-lint-ignore-file no-explicit-any

import { log, z } from "../deps.ts";
import * as zoddb from "../_common/zoddb.ts";
import { SQL } from "../_common/sql.ts";
import seedKeys from "./seed_keys.ts";
import json from "../_common/json.ts";
import {
  as,
  assertStatic,
  AsyncCallback,
} from "../_common/utility_types/mod.ts";
import { assert, expect, notImplemented } from "../_common/assertions.ts";
import {
  CaptureId,
  GameId,
  PlayerId,
  PlayerName,
  PlayerNumber,
  SkuId,
  StateId,
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
  seedKeys?: Readonly<Array<Unbox<KeyType>>>;
  cacheControl?: CacheControl;
  makeRequest: (
    key: Unbox<KeyType>,
    context: RequestContext,
  ) => Array<[string, ProtoMessage?]> | Promise<Array<[string, ProtoMessage?]>>;
  parseResponse: (
    response: ProtoMessage,
    key: Unbox<KeyType>,
    context: RequestContext,
  ) => Unbox<ValueType> | Promise<Unbox<ValueType>>;
}) => {
  const rowType = z.object(
    {
      key: definition.keyType,
      value: definition.valueType.optional(),
      _request: ProtoMessage.optional(),
      _response: ProtoMessage.optional(),
      _lastUpdatedTimestamp: z.number().positive().optional(),
      _lastUpdateAttemptedTimestamp: z.number().positive().optional(),
    } as const,
  );

  (definition.columns as any)["key"] = "unique";
  (definition.columns as any)["_lastUpdatedTimestamp"] = "indexed";
  (definition.columns as any)["_lastUpdateAttemptedTimestamp"] = "indexed";

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
        } else {
          log.info(`${tableName} was previously seeded.`);
          // This table has already been seeded, skip the rest.
          break;
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

  abstract seedChild<
    DependencyKeyType extends z.ZodTypeAny,
  >(
    definition: {
      keyType: DependencyKeyType;
    },
    keyValue: Unbox<DependencyKeyType>,
  ): Promise<boolean>;

  abstract updateChild<
    DependencyKeyType extends z.ZodTypeAny,
    DependencyValueType extends z.ZodTypeAny,
  >(
    definition: {
      keyType: DependencyKeyType;
      valueType: DependencyValueType;
    },
    keyValue: Unbox<DependencyKeyType>,
    valueValue: Unbox<DependencyValueType>,
  ): Promise<unknown>;
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

  async seedChild<
    DependencyKeyType extends z.ZodTypeAny,
  >(
    definition: {
      keyType: DependencyKeyType;
    },
    keyValue: Unbox<DependencyKeyType>,
  ): Promise<boolean> {
    return await notImplemented() ?? definition ?? keyValue;
  }

  async updateChild<
    DependencyKeyType extends z.ZodTypeAny,
    DependencyValueType extends z.ZodTypeAny,
  >(
    definition: {
      keyType: DependencyKeyType;
      valueType: DependencyValueType;
    },
    keyValue: Unbox<DependencyKeyType>,
    valueValue: Unbox<DependencyValueType>,
  ): Promise<unknown> {
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
    seedKeys: seedKeys.Player,
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
    parseResponse: (protos) => {
      log.info(`UNSUPPORTED RESPONSE FOR NOW: ${Deno.inspect(protos)}`);
      return notImplemented();
    },
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
    seedKeys: seedKeys.Game,
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
    seedKeys: seedKeys.Sku,
    makeRequest: (skuId) => [["FWhQV", [null, skuId]]],
    parseResponse: (protos) => {
      log.info(`UNSUPPORTED RESPONSE FOR NOW: ${Deno.inspect(protos)}`);
      return notImplemented();
    },
  });

  const PlayerProgression = def({
    keyType: PlayerId,
    valueType: z.object({}),
    columns: {},
    cacheControl: "max-age=115200",
    seedKeys: seedKeys.Player,
    async makeRequest(playerId, context) {
      const player = await context.getDependency(Player, playerId);
      return player.playedGameIds.map((gameId) => [
        "e7h9qd",
        [null, gameId, playerId],
      ]);
    },
    parseResponse: (protos) => {
      log.info(`UNSUPPORTED RESPONSE FOR NOW: ${Deno.inspect(protos)}`);
      return notImplemented();
    },
  });

  const StoreList = def({
    cacheControl: "max-age=1920",
    keyType: StoreListId,
    columns: {},
    valueType: z.object({
      name: z.string().nonempty(),
      skuIds: z.array(SkuId),
    }),
    seedKeys: seedKeys.StoreList,
    makeRequest: (listId) => [
      ["ZAm7We", [null, null, null, null, null, listId]],
    ],
    parseResponse: (protos) => {
      log.info(`UNSUPPORTED RESPONSE FOR NOW: ${Deno.inspect(protos)}`);
      return notImplemented();
    },
  });

  const PlayerSearch = def({
    cacheControl: "max-age=5529600",
    keyType: z.string().min(2).max(20).regex(/^[a-z][a-z0-9]+$/),
    valueType: z.array(PlayerId),
    columns: {},
    seedKeys: seedKeys.PlayerSearch,
    makeRequest: (playerPrefix) => [
      ["FdyJ0", [playerPrefix.slice(0, 1) + " " + playerPrefix.slice(1)]],
    ],
    parseResponse: (protos) => {
      log.info(`UNSUPPORTED RESPONSE FOR NOW: ${Deno.inspect(protos)}`);
      return notImplemented();
    },
  });

  const MyGames = def({
    cacheControl: "no-store,max-age=0",
    keyType: z.literal("myGames"),
    valueType: z.array(z.object({
      gameId: GameId,
      skuId: SkuId,
    })),
    columns: {},
    seedKeys: ["myGames"],
    makeRequest: () => [["T2ZnGf"]],
    parseResponse: (protos: any, _, context) =>
      protos?.[0]?.[2]?.map((p: any) => {
        const sku = skuFromProto.parse(p[1]) ?? [];
        context.seedChild(Sku, sku.skuId);
        context.seedChild(Game, expect(sku.gameId));
        return sku;
      }),
  });

  const MyRecentPlayers = def({
    cacheControl: "no-store,max-age=0",
    keyType: z.literal("myRecentPlayers"),
    makeRequest: () => [["nsSFNb"]],
    valueType: z.array(z.object({
      playerId: PlayerId,
      gameId: GameId.optional(),
    })),
    columns: {},
    seedKeys: ["myRecentPlayers"],
    parseResponse: (protos) => {
      log.info(`UNSUPPORTED RESPONSE FOR NOW: ${Deno.inspect(protos)}`);
      return notImplemented();
    },
  });

  const MyFriends = def({
    cacheControl: "no-store,max-age=0",
    keyType: z.literal("myFriends"),
    valueType: z.object({
      playerId: PlayerId,
      playerIds: z.array(PlayerId),
    }),
    columns: {},
    seedKeys: ["myFriends"],
    makeRequest: () => [["Z5HRnb"]],
    parseResponse: (protos) => {
      log.info(`UNSUPPORTED RESPONSE FOR NOW: ${Deno.inspect(protos)}`);
      return notImplemented();
    },
  });

  const MyPurchases = def({
    cacheControl: "no-store,max-age=0",
    keyType: z.literal("myPurchases"),
    valueType: z.array(SkuId),
    columns: {},
    seedKeys: ["myPurchases"],
    makeRequest: () => [["uwn0Ob"]],
    parseResponse: (protos) => {
      log.info(`UNSUPPORTED RESPONSE FOR NOW: ${Deno.inspect(protos)}`);
      return notImplemented();
    },
  });

  const Capture = def({
    cacheControl: "max-age=44236800",
    keyType: CaptureId,
    valueType: z.object({
      captureId: CaptureId,
      gameId: GameId,
      timestamp: z.number(),
      imageUrl: z.string(),
      videoUrl: z.string().optional(),
      stateId: StateId.optional(),
    }),
    columns: {},
    seedKeys: seedKeys.Capture,
    makeRequest: (captureId) => [["g6aH1", [captureId]]],
    parseResponse: (protos) => {
      log.info(`UNSUPPORTED RESPONSE FOR NOW: ${Deno.inspect(protos)}`);
      return notImplemented();
    },
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
    MyRecentPlayers,
    Capture,
  } as const;

  assertStatic as as.StrictlyExtends<typeof defs, zoddb.TableDefinitions>;

  return defs;
})();
