import { Client } from "../../stadia/client.ts";
import { FlagArgs, FlagOpts, log, z } from "../../deps.ts";
import * as models from "../../stadia/models.ts";
import { expect, unreachable } from "../../_common/assertions.ts";
import zoddb from "../../_common/zoddb.ts";
import { flatMap } from "../../_common/iterators.ts";
import { sleep } from "../../_common/async.ts";
import { Player } from "../../stadia/protos.ts";

export const flags: FlagOpts = {
  string: "sqlite",
  default: {
    sqlite: "./spider.sqlite",
  },
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

const remoteModel = <T>() => {

};

export const command = async (_: Client, flags: FlagArgs) => {
  open({
    Player: playerTable,
    Game: gameTable,
    Sku: skuTable,
    StoreList: storeListTable,
    UserSearch: userSearchTable,
  });

  const Player = db.Player;
  type Player = z.infer<typeof Player.type>;
};

export const open = async <T>() => {
  const db = zoddb.open(flags.sqlite, {
  });

};

const PlayerType = z.object({
  playerId: PlayerId,
  _request: ProtoMessage,
  player: z.object({
    _response: ProtoMessage,
    _timestamp: z.number().positive(),
    name: PlayerName,
    number: PlayerNumber,
    friendPlayerIds: z.array(PlayerId),
  }).optional(),
});
type PlayerType = z.infer<typeof PlayerType>;

const playerTable = {
  type: PlayerType,
  columns: {
    playerId: "unique",
    "player.name": "indexed",
    "player.number": "virtual",
  },
  toRequest(player: Omit<PlayerType, "_request">): ProtoMessage {
    return [
      [
        "D0Amud",
        [null, true, null, null, player.playerId],
      ],
      [
        "Z5HRnb",
        [null, true, player.playerId],
      ],
      [
        "Q6jt8c",
        [null, null, null, player.playerId],
      ],
    ];
  },
  fromResponse(
    response: NonNullable<PlayerType["player"]>["_response"],
  ): Omit<NonNullable<PlayerType["player"]>, "_response" | "_timestamp"> {
    return {
      name: "test",
      number: "1234",
      friendPlayerIds: [],
    };
  },
} as const;
