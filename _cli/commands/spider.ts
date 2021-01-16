import { Client } from "../../stadia/client.ts";
import { FlagArgs, FlagOpts, log, z } from "../../deps.ts";
import * as models from "../../stadia/models.ts";
import { expect, unreachable } from "../../_common/assertions.ts";
import zoddb, {
  ColumnDefinitions,
  ColumnType,
  TableDefinitions,
} from "../../_common/zoddb.ts";
import { flatMap } from "../../_common/iterators.ts";
import { sleep } from "../../_common/async.ts";
import { Player } from "../../stadia/protos.ts";
import { NoInfer } from "../../_common/utility_types/mod.ts";

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

  let x: Player["remoteModel"];

  Player.insert({
    playerId: [],
    player: []
  });

  console.log(`There are ${Player.count()} Players.`);

  console.log(Player.get());
};

export const Proto: z.ZodSchema<Proto> = z.union([
  z.null(),
  z.number(),
  z.string(),
  z.boolean(),
  z.array(z.lazy(() => Proto)),
]);
export type Proto = null | number | string | boolean | Array<Proto>;

const ProtoMessage = Proto.array();
type ProtoMessage = z.infer<typeof ProtoMessage>;

const printableAscii = z.string().regex(
  /^[\x20-\x7E]*$/,
  "printable ascii",
);

export const GameId = z.string().regex(/^[0-9a-f]+(rcp1)$/);
export const SkuId = z.string().regex(/^[0-9a-f]+(p)?$/);
export const OrganizationId = z.string().regex(/^[0-9a-f]+(pup1)$/);
export const PlayerId = z.string().regex(/^[1-9][0-9]*$/);
export const PlayerName = z.string().min(3).max(15);
export const PlayerNumber = z.string().length(4).regex(
  /^(0000|[1-9][0-9]{3})$/,
);

export const openDB = (path: string) => {
  const remoteModels = {
    Player: remoteModel({
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
      makeRequest(playerId: z.output<typeof PlayerId>): ProtoMessage {
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
      parseResponse(response: ProtoMessage, playerId: z.output<typeof PlayerId>) {
        return {
          name: (response as any)[0]?.[1],
          number: (response as any)[0],
          friendPlayerIds: [], // TODO
        };
      },
    }),
  } as const;

  const db = zoddb.open(path, {
    ...remoteModels,
  });

  // for (const [name, remoteModel] of Object.entries(remoteModels)) {
  //   const table = db.tables[name as keyof typeof remoteModels];
  //   const { makeRequest, parseResponse } = remoteModel;
  //   Object.assign(table, { makeRequest, parseResponse, remoteModel });
  // }

  return db; // as ((typeof db) & {
  //   tables: {
  //     [K in keyof typeof db.tables]: {
  //       makeRequest: (typeof remoteModels)[K]["makeRequest"];
  //       parseResponse: (typeof remoteModels)[K]["parseResponse"];
  //       remoteModel: (typeof remoteModels)[K];
  //     };
  //   };
  // });
};

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
      } as const),
    ).optional(),
  } as const);

  return {
    type: rowType,
    columns,
    makeRequest,
    parseResponse,
  } as const;
};
