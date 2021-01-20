/** Declares our Stadia tables with their associated RPCs. */

import { z } from "../deps.ts";
import * as zoddb from "../_common/zoddb.ts";
import { SQL } from "../_common/sql.ts";
import bigrams from "../_common/bigrams.ts";
import { as, assertStatic } from "../_common/utility_types/mod.ts";
import { notImplemented } from "../_common/assertions.ts";
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
import { ProtoMessage } from "../_common/proto.ts";

type Unbox<T extends z.ZodTypeAny> = NoInfer<
  z.infer<NoInfer<T>>
>;

export const def = <
  KeyName extends string,
  KeyType extends z.ZodTypeAny,
  ValueName extends string,
  ValueType extends z.ZodTypeAny,
  ThisColumnDefinitions extends ColumnDefinitions,
  CacheControl extends `no-store,max-age=0` | `max-age=${string}` | undefined,
>(definition: {
  keyName: KeyName;
  keyType: KeyType;
  valueName: ValueName;
  valueType: ValueType;
  seedKeys?: Array<Unbox<KeyType>>;
  cacheControl?: CacheControl;
  columns?: ThisColumnDefinitions;
  makeRequest: (
    key: Unbox<KeyType>,
    context: RequestContext,
  ) => ProtoMessage | Promise<ProtoMessage>;
  parseResponse: (
    response: ProtoMessage,
    key: Unbox<KeyType>,
  ) => Unbox<ValueType>;
}) => {
  const rowType = z.object({
    [definition.keyName]: definition.keyType,
    [definition.valueName]: definition.valueType.optional(),
    _request: ProtoMessage.optional(),
    _response: ProtoMessage.optional(),
    _lastUpdatedTimestamp: z.number().positive().optional(),
  });

  const d = {
    ...definition,
    rowType,
  } as const;

  assertStatic as as.StrictlyExtends<typeof d, TableDefinition>;

  return d;
};

export class StadiaDatabase {
  constructor(
    readonly path: string,
  ) {}

  readonly tableDefinitions = tableDefinitions;
  readonly database = zoddb.open(this.path, this.tableDefinitions);
  readonly tables = (() => {
    const result = {} as unknown as {
      [TableName in keyof typeof tableDefinitions]: StadiaTable<
        typeof tableDefinitions[TableName]
      >;
    };
    for (
      const name of Object.keys(
        this.database.tables,
      ) as (keyof typeof result)[]
    ) {
      const table = new StadiaTable(
        this,
        tableDefinitions[name],
        this.database.tables[name] as any,
      );
      for (const key of tableDefinitions[name].seedKeys ?? []) {
        table.seed(key);
      }
      result[name] = table as any;
    }
    return result;
  })();
}

export class StadiaTable<Definition extends TableDefinition> {
  constructor(
    readonly database: StadiaDatabase,
    readonly definition: TableDefinition,
    readonly zodTable: zoddb.Table<
      z.infer<Definition["rowType"]>,
      Definition["rowType"],
      NonNullable<Definition["columns"]>
    >,
  ) {}

  seed(key: Unbox<Definition["keyType"]>): boolean {
    return this.zodTable.insert({
      [this.definition.keyName]: key,
    });
  }

  get(
    key: Unbox<Definition["keyType"]>,
  ): Unbox<Definition["valueType"]> | undefined {
    const row: Unbox<Definition["rowType"]> | undefined = this.zodTable.get({
      where: SQL`${this.definition.keyName} = ${key}`,
    });
    return row?.[this.definition.valueName] as any;
  }

  delete(key: Unbox<Definition["keyType"]>): boolean {
    return this.zodTable.delete({
      where: SQL`${this.definition.keyName} = ${key}`,
    }) > 0;
  }
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
    keyName: "playerId",
    keyType: PlayerId,
    valueName: "player",
    valueType: z.object({
      name: PlayerName,
      number: PlayerNumber,
      friendPlayerIds: z.array(PlayerId),
      playedGameIds: z.array(GameId),
    }),
    columns: {
      "player.name": "indexed",
      "player.number": "virtual",
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
    parseResponse(response) {
      return {
        name: (response as any)[0]?.[1],
        number: (response as any)[0],
        friendPlayerIds: [],
        playedGameIds: [],
      };
    },
    seedKeys: [
      // Jeremy
      "5478196876050978967",
      // usr
      "956082794034380385",
      // prototest
      "5904879799764",
      // denoStadia (lots of friends, mostly-public profile)
      "13541093767486303504",
    ],
  });

  const Game = def({
    cacheControl: "max-age=57600",
    keyName: "gameId",
    keyType: GameId,
    valueName: "game",
    valueType: z.object({
      skuId: SkuId,
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
    ],
    parseResponse: notImplemented,
  });

  const Sku = def({
    cacheControl: "max-age=1382400",
    keyName: "skuId",
    keyType: SkuId,
    valueName: "sku",
    valueType: z.object({
      name: z.string(),
    }),
    columns: {
      name: "indexed",
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
    keyName: "playerId",
    keyType: PlayerId,
    valueName: "playerProgression",
    valueType: z.object({}),
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
    keyName: "storeListId",
    keyType: StoreListId,
    valueName: "storeList",
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
    keyName: "playerPrefix",
    keyType: z.string().min(2).max(20),
    valueName: "playerIds",
    valueType: z.array(PlayerId),
    seedKeys: bigrams,
    makeRequest: (playerPrefix) => [
      ["FdyJ0", [playerPrefix.slice(0, 1) + " " + playerPrefix.slice(1)]],
    ],
    parseResponse: notImplemented,
  });

  const MyGames = def({
    cacheControl: "max-age=172800",
    keyName: "MyGames",
    keyType: z.literal("myGames"),
    valueName: "gameIds",
    valueType: z.array(GameId),
    makeRequest: () => [["T2ZnGf"]],
    parseResponse: notImplemented,
  });

  const MyFriends = def({
    cacheControl: "no-store,max-age=0",
    keyName: "MyFriends",
    keyType: z.literal("myFriends"),
    valueName: "playerIds",
    valueType: z.array(PlayerId),
    makeRequest: () => [["Z5HRnb"]],
    parseResponse: notImplemented,
  });

  const MyPurchases = def({
    cacheControl: "no-store,max-age=0",
    keyName: "MyPurchases",
    keyType: z.literal("myPurchases"),
    valueName: "skuIds",
    valueType: z.array(SkuId),
    makeRequest: () => [["uwn0Ob"]],
    parseResponse: notImplemented,
  });

  const defs = {
    Player,
    Game,
    Sku,
    StoreList,
    ...{} ?? notImplemented({
      PlayerProgression,
      PlayerSearch,
      MyGames,
      MyPurchases,
      MyFriends,
    }),
  };

  assertStatic as as.StrictlyExtends<typeof defs, zoddb.TableDefinitions>;

  return defs;
})();

type TableDefinition = (typeof tableDefinitions)[keyof typeof tableDefinitions];
