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

export const command = async (_: Client, flags: FlagArgs) => {
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
  const PlayerSchema = {
    type: PlayerType,
    columns: {
      playerId: "unique",
      "player.name": "indexed",
      "player.number": "virtual",
    },
    toRequest(player: Omit<Player, "_request">): ProtoMessage {
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
      response: NonNullable<Player["player"]>["_response"],
    ): Omit<NonNullable<Player["player"]>, "_response" | "_timestamp"> {
      return {
        name: "test",
        number: "1234",
        friendPlayerIds: [],
      };
    },
  } as const;

  const db = zoddb.open(flags.sqlite, {
    Player: PlayerSchema,
  });
  type Player = z.infer<typeof PlayerType>;
  const Player = db.Player;

  const p = {
    playerId: "2",
  };

  Player.insert({
    _request: PlayerSchema.toRequest(p),
    ...p,
  });

  Player.update({
    _request: PlayerSchema.toRequest(p),
    ...p,
  });

  Player.insert({
    _request: PlayerSchema.toRequest(p),
    ...p,
  });

  const only = Player.get();
  console.log({ only });

  const player: Player = Player.get({ where: Player.playerId.eq("2") });

  console.log({ player });
};
