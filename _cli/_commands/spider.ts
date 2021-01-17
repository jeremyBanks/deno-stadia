import { Client } from "../../stadia/client.ts";
import { FlagArgs, FlagOpts, z } from "../../deps.ts";
import zoddb, { ColumnDefinitions } from "../../_common/zoddb.ts";
import { NoInfer } from "../../_common/utility_types/mod.ts";
import bigrams from "../../_common/bigrams.ts";
import { Proto } from "../../_common/proto.ts";

export const flags: FlagOpts = {
  string: "sqlite",
  default: {
    sqlite: "./spider.sqlite",
  },
};

export const command = async (_: Client, flags: FlagArgs) => {
  const db = openDB(flags.sqlite);
  const { Player } = db;
  type Player = z.infer<typeof Player["type"]>;

  console.log(`There are ${Player.count()} Players.`);

  Player.insert({
    playerId: "134",
    request: Player.remoteModel.makeRequest("134"),
  });

  console.log(`There are ${Player.count()} Players.`);

  console.log(Player.get());
};

export class StadiaClient {
  constructor(
    readonly database: StadiaDatabase,
  ) {}
}

export class StadiaDatabase {
  constructor(
    private path: string,
  ) {}

  // private readonly stadiaModelDefinitions = readonly;
  db = zoddb.open(this.path, {});
}

export const GameId = z.string().regex(/^[0-9a-f]+(rcp1)$/);
export type GameId = z.infer<typeof GameId>;
export const SkuId = z.string().regex(/^[0-9a-f]+(p)?$/);
export type SkuId = z.infer<typeof SkuId>;
export const OrganizationId = z.string().regex(/^[0-9a-f]+(pup1)$/);
export type OrganizationId = z.infer<typeof OrganizationId>;
export const PlayerId = z.string().regex(/^[1-9][0-9]*$/);
export type PlayerId = z.infer<typeof PlayerId>;
export const PlayerName = z.string().min(3).max(15);
export type PlayerName = z.infer<typeof PlayerName>;
export const PlayerNumber = z.string().length(4).regex(
  /^(0000|[1-9][0-9]{3})$/,
);
export type PlayerNumber = z.infer<typeof PlayerNumber>;

const remoteModel = <
  KeyName extends string,
  KeySchemaType extends z.ZodSchema<{}>,
  ValueName extends string,
  ValueSchemaType extends z.ZodSchema<{}>,
  ThisColumnDefinitions extends ColumnDefinitions,
>({
  keyName,
  keyType,
  valueName,
  valueType,
  columns,
  makeRequest,
  parseResponse,
}: {
  keyName: KeyName;
  keyType: KeySchemaType;
  valueName: ValueName;
  valueType: ValueSchemaType;
  columns: ThisColumnDefinitions;
  makeRequest: (
    key: NoInfer<z.infer<KeySchemaType>>,
  ) => ProtoMessage;
  parseResponse: (
    response: ProtoMessage,
    key: NoInfer<z.infer<KeySchemaType>>,
  ) => z.infer<ValueSchemaType>;
}) => {
  const rowType = z.object({
    [keyName]: keyType,
    _request: ProtoMessage,
    [valueName]: z.intersection(
      valueType,
      z.object({
        _response: ProtoMessage,
        _timestamp: z.number(),
      }),
    ).optional(),
  });

  return {
    type: rowType,
    keyType,
    valueType,
    columns,
    makeRequest,
    parseResponse,
  } as const;
};

const stadiaModelDefinitions = {
  Player: {
    cacheControl: "max-age=11059200",
    keyName: "playerId",
    keyType: PlayerId,
    valueName: "player",
    valueType: z.object({
      name: PlayerName,
      number: PlayerNumber,
      friendPlayerIds: z.array(PlayerId),
    }),
    columns: {
      playerId: "unique",
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
        friendPlayerIds: [], // TODO
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
  },
  Game: {
    cacheControl: "max-age=57600",
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
  },
  Sku: {
    cacheControl: "max-age=1382400",
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
  },
  PlayerStats: {
    cacheControl: "max-age=115200",
    seedKeys: [
      // denoStadia
      "13541093767486303504",
    ],
  },
  StoreList: {
    cacheControl: "max-age=1920",
    seedKeys: [
      // All games
      "3",
    ],
  },
  PlayerSearch: {
    cacheControl: "max-age=5529600",
    // exhaustive list of prefixes (our minimum search length is 2)
    seedKeys: bigrams,
  },
  MyGames: {
    cacheControl: "max-age=172800",
    keyName: "MyGames",
    keyType: z.literal("MyGames"),
    valueName: "myGames",
    valueType: z.object({
      skuId: SkuId,
      gameId: GameId,
    }).array(),
    makeRequest(_: unknown) {
      return [
        [
          "T2ZnGf",
          [],
        ],
      ];
    },
  },
  MyFriends: {
    cacheControl: "no-store,max-age=0",
    keyType: z.literal("MyFriends"),
    valueName: "myFriends",
    valueType: z.object({
      myPlayerId: PlayerId,
      friendPlayerIds: PlayerId.array(),
    }),
    makeRequest() {
      return [[
        "Z5HRnb",
        [],
      ]];
    },
  },
  MyPurchases: {
    cacheControl: "no-store,max-age=0",
    keyName: "MyPurchases",
    keyType: z.literal("MyPurchases"),
    valueName: "myPurchases",
    valueType: z.object({
      skuId: SkuId,
      gameId: GameId,
    }).array(),
    makeRequest(_: "key") {
      return [
        [
          "uwn0Ob",
          [],
        ],
      ];
    },
  },
};

export const openDB = (path: string) => {
  const remoteModels = {} as const;

  // This is cute, but very stupid. Get rid of it.
  for (const [name, remoteModel] of Object.entries(remoteModels)) {
    const table = db.tables[name as keyof typeof remoteModels];
    Object.assign(table, { remoteModel });
  }
  return db as (
    & (typeof db)
    & {
      [K in keyof typeof db.tables]: {
        remoteModel: (typeof remoteModels)[K];
      };
    }
  );
};
