/** Declares our Stadia tables with their associated RPCs. */

// deno-lint-ignore-file no-explicit-any

import { log, z } from "../deps.ts";
import * as zoddb from "../_common/zoddb.ts";
import { SQL } from "../_common/sql.ts";
import seedKeys from "./seed_keys.ts";
import json from "../_common/json.ts";
import { as, assertStatic } from "../_common/utility_types/mod.ts";
import {
  assert,
  expect,
  notImplemented,
  unreachable,
  untyped,
} from "../_common/assertions.ts";
import {
  CaptureId,
  GameId,
  GamertagPrefix,
  PlayerId,
  PlayerName,
  PlayerNumber,
  SkuId,
  StateId,
  StoreListId,
  SubscriptionId,
} from "./common_scalars.ts";
import { ColumnDefinitions } from "../_common/zoddb.ts";
import { NoInfer } from "../_common/utility_types/mod.ts";
import { Proto, ProtoMessage } from "../_common/proto.ts";
import { playerFromProto, skuFromProto } from "./response_parsers.ts";
import * as models from "./models.ts";

type Unbox<T extends z.ZodTypeAny> = NoInfer<
  z.infer<NoInfer<T>>
>;

export const def = <
  KeyType extends z.ZodType<string | number, z.ZodTypeDef, string | number>,
  ValueType extends z.ZodTypeAny,
  CacheControl extends `no-store,max-age=0` | `max-age=${string}` | undefined,
  ThisColumnDefinitions extends {
    [Key in keyof ColumnDefinitions]: ColumnDefinitions[Key];
  },
>(definition: {
  name: string;
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

  const columns = untyped(definition.columns);
  for (const key of Object.keys(columns)) {
    columns[`value.${key}`] = columns[key];
    delete columns[key];
  }

  untyped(definition.columns)["key"] = "unique";
  untyped(definition.columns)["_lastUpdatedTimestamp"] = "indexed";
  untyped(definition.columns)["_lastUpdateAttemptedTimestamp"] = "indexed";
  untyped(definition.columns)["_request"] = "virtual";
  untyped(definition.columns)["_response"] = "virtual";
  untyped(definition.columns)["value"] = "virtual";

  const d = {
    ...definition,
    rowType,
  } as const;

  assertStatic as as.StrictlyExtends<typeof d, zoddb.TableDefinition>;

  return d;
};

export class StadiaDatabase {
  constructor(
    readonly path: string,
  ) {}

  readonly tableDefinitions = tableDefinitions;
  readonly database = zoddb.open(this.path, this.tableDefinitions);
  readonly seeded = (() => {
    this.database.sql(SQL`begin deferred transaction`);

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

    this.database.sql(SQL`commit transaction`);
    log.info(`Seeded ${count} records`);
  })();
}

abstract class RequestContext {
  /** Timestamp at which this request was initiated. */
  readonly requestTimestamp = Date.now();

  /** Timestamp before which data will be considered stale/expired for the
      purposes of this request, or undefined to use each record's default. */
  abstract minFreshTimestamp?: number;

  abstract getDependency<
    Definition extends ReturnType<typeof def>,
  >(
    dependency: Definition,
    keyValue: Unbox<Definition["keyType"]>,
  ): Promise<Unbox<Definition["valueType"]>>;

  abstract seed<
    Definition extends ReturnType<typeof def>,
  >(
    definition: Definition,
    childKey: Unbox<Definition["keyType"]>,
  ): Promise<boolean>;
}

export class DatabaseRequestContext extends RequestContext {
  constructor(
    readonly database: StadiaDatabase,
    readonly maxAgeSeconds = Infinity,
  ) {
    super();
  }

  readonly minFreshTimestamp = this.requestTimestamp - this.maxAgeSeconds;

  // deno-lint-ignore require-await
  async getDependency<
    Definition extends ReturnType<typeof def>,
  >(
    definition: Definition,
    dependencyKey: Unbox<Definition["keyType"]>,
  ): Promise<Unbox<Definition["valueType"]>> {
    const table: zoddb.Table<Definition["rowType"]> =
      (this.database.database.tables as any)[definition.name];
    const existing = table.get({
      where: SQL`key = ${dependencyKey as string | number}`,
    });
    if (existing) {
      return existing;
    } else {
      return notImplemented("fetching non-cached dependencies not implemented");
    }
  }

  // deno-lint-ignore require-await
  async seed<
    Definition extends ReturnType<typeof def>,
  >(
    definition: Definition,
    childKey: Unbox<Definition["keyType"]>,
  ): Promise<boolean> {
    const table: zoddb.Table<Definition["rowType"]> =
      (this.database.database.tables as any)[definition.name];

    const key = definition.keyType.parse(childKey);
    if (
      !table.get({
        where: SQL`key = ${key}`,
      }) && table.insert({
        key,
      } as any)
    ) {
      log.info(`Discovered ${definition.name} ${key}`);
      return true;
    } else {
      return false;
    }
  }
}

const tableDefinitions = (() => {
  const Player = def({
    name: "Player",
    cacheControl: "max-age=11059200",
    keyType: PlayerId,
    valueType: z.object({
      name: PlayerName,
      number: PlayerNumber,
      friendPlayerIds: z.array(PlayerId),
      playedGameIds: z.array(GameId),
    }),
    columns: {
      name: "indexed",
      number: "virtual",
      friendPlayerIds: "virtual",
      playedGameIds: "virtual",
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
    parseResponse: (protos: any, playerId, context) => {
      const [profileProto, friendProto, gamesProto] = protos;

      const name = expect(profileProto[5][0][0]);
      const number = expect(profileProto[5][0][1]);
      const playedGameIds = gamesProto?.[0] ?? [];

      const friendPlayerIds = (friendProto?.[0] ?? []).map((p: any) => p[5]);

      for (const gameId of playedGameIds) {
        context.seed(untyped(Game), gameId);
      }

      for (const playerId of friendPlayerIds) {
        context.seed(untyped(Player), playerId);
      }

      context.seed(untyped(PlayerProgression), playerId);

      return {
        name,
        number,
        friendPlayerIds,
        playedGameIds,
      };
    },
  });

  const Game = def({
    name: "Game",
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
    parseResponse: (proto: any, gameId, context) => {
      if (proto[0]?.[0] === null && proto[1]?.length === 0) {
        throw new Error(
          `found no skus for game ${gameId}. this should only be the case for subscriptions, so it should not be common. not currently supported`,
        );
      }

      const gameProto: Proto = (proto as any)[1][1][0][1][9];
      const gameSku = skuFromProto.parse(gameProto);

      const listedSkus: Array<models.Sku> | null = (proto as any)[0]?.[0]?.map((
        x: any,
      ) => skuFromProto.parse(x[9]));

      if (!listedSkus) {
        log.info(
          `No skus listed for ${gameSku.name} ${gameSku.gameId} ${gameSku.skuId}`,
        );
      }

      const skus = listedSkus ?? [gameSku];

      for (const sku of skus) {
        context.seed(untyped(Sku), sku.skuId);
      }

      assert(gameId === gameSku.gameId);

      return {
        skuId: gameSku.skuId,
        skuIds: skus.map((sku) => sku.skuId),
      };
    },
  });

  const Sku = def({
    name: "Sku",
    cacheControl: "max-age=1382400",
    keyType: SkuId,
    valueType: models.Sku,
    columns: {
      gameId: "indexed",
      skuType: "indexed",
      name: "indexed",
      description: "virtual",
    },
    seedKeys: seedKeys.Sku,
    makeRequest: (skuId) => [["FWhQV", [null, skuId]]],
    parseResponse: (protos: any, key, context) => {
      if (protos[0] === null) {
        log.warning(
          `requested sku ${key} appears to have been deleted. this should not be frequent.`,
        );
        const deleted: models.DeletedSku = {
          type: "sku",
          skuType: "Deleted",
          skuId: key,
          coverImageUrl: null,
          description: null,
          developerOrganizationIds: null,
          gameId: null,
          internalName: null,
          name: null,
          publisherOrganizationId: null,
          timestampA: null,
          timestampB: null,
        };
        return deleted;
      }

      const sku = skuFromProto.parse(protos[0][16]);
      if (sku.skuId !== key) {
        log.warning(
          `response sku ${sku.skuId} did not match request sku ${key}. this should be not be frequent.`,
        );
        context.seed(untyped(Sku), sku.skuId);
        const alias: models.AliasSku = {
          type: "sku",
          skuType: "Alias",
          skuId: key,
          targetSkuId: sku.skuId,
          coverImageUrl: null,
          description: null,
          developerOrganizationIds: null,
          gameId: null,
          internalName: null,
          name: null,
          publisherOrganizationId: null,
          timestampA: null,
          timestampB: null,
        };
        return alias;
      }
      context.seed(untyped(Game), sku.gameId);
      return sku;
    },
  });

  const Subscription = def({
    name: "Subscription",
    keyType: SubscriptionId,
    valueType: z.object({}),
    columns: {},
    cacheControl: "max-age=14400",
    seedKeys: seedKeys.Subscription,
    makeRequest: (subscriptionId) => [["Z5yYme", [subscriptionId]]],
    parseResponse: (protos) => {
      log.info(`UNSUPPORTED RESPONSE FOR NOW: ${Deno.inspect(protos)}`);
      return {};
    },
  });

  const PlayerProgression = def({
    name: "PlayerProgression",
    keyType: PlayerId,
    valueType: z.object({}),
    columns: {},
    cacheControl: "max-age=115200",
    seedKeys: [],
    async makeRequest(playerId, context) {
      const player = await context.getDependency(untyped(Player), playerId);
      return player.playedGameIds.map((gameId: GameId) => [
        "e7h9qd",
        [null, gameId, playerId],
      ]);
    },
    parseResponse: (protos) => {
      log.info(`UNSUPPORTED RESPONSE FOR NOW: ${Deno.inspect(protos)}`);
      return {};
    },
  });

  const StoreList = def({
    name: "StoreList",
    cacheControl: "max-age=1920",
    keyType: StoreListId,
    columns: {},
    valueType: z.array(z.object({
      skuId: SkuId,
      gameId: GameId,
    })),
    seedKeys: seedKeys.StoreList,
    makeRequest: (listId) => [
      ["ZAm7We", [null, null, null, null, null, listId]],
    ],
    parseResponse: (protos: any, key, context) => {
      const results: Array<{ skuId: SkuId; gameId: GameId }> = [];
      for (const p of protos[0]?.[0] ?? []) {
        const d = expect(p?.[9]);
        const sku = skuFromProto.parse(d);
        const skuId = sku.skuId;
        const gameId = expect(sku.gameId);
        context.seed(untyped(Sku), skuId);
        context.seed(untyped(Game), gameId);
        results.push({
          skuId,
          gameId,
        });
      }
      return results;
    },
  });

  const PlayerSearch = def({
    name: "PlayerSearch",
    cacheControl: "max-age=5529600",
    keyType: GamertagPrefix.min(2),
    valueType: z.array(PlayerId),
    columns: {},
    seedKeys: seedKeys.PlayerSearch,
    makeRequest: (playerPrefix) => [
      ["FdyJ0", [playerPrefix.slice(0, 1) + " " + playerPrefix.slice(1)]],
    ],
    parseResponse: ([proto]: any, prefix, context) => {
      if (!proto?.[1]?.length) {
        log.info(`No results for PlayerSearch ${prefix}.`);
        return [];
      }

      const playerIds = proto[1].map((p: any) => p[0][5]) as Array<PlayerId>;
      for (const playerId of playerIds) {
        context.seed(untyped(Player), playerId);
      }
      if (playerIds.length >= 100) {
        if (prefix.length < 15) {
          for (const c of "abcdefghijklmnopqrstuvwxyz0123456789") {
            context.seed(untyped(PlayerSearch), prefix + c);
          }
        } else if (prefix.length === 15) {
          for (const d of "0123456789") {
            context.seed(untyped(PlayerSearch), prefix + "#" + d);
          }
        } else if (prefix.length < 20) {
          for (const d of "0123456789") {
            context.seed(untyped(PlayerSearch), prefix + d);
          }
        } else {
          return unreachable(
            `Are there really 100 matches for ${prefix}? Seems unlikely.`,
          );
        }
      }
      return playerIds;
    },
  });

  const MyGames = def({
    name: "MyGames",
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
        context.seed(untyped(Sku), sku.skuId);
        context.seed(untyped(Game), expect(sku.gameId));
        return sku;
      }),
  });

  const MyRecentPlayers = def({
    name: "MyRecentPlayers",
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
    name: "MyFriends",
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
    name: "MyPurchases",
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
    name: "Capture",
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
    Subscription,
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
