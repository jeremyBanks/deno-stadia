import { z } from "../deps.ts";
import { assert, expect } from "../_common/assertions.ts";

export const Proto: z.ZodSchema<Proto> = z.union([
  z.null(),
  z.number(),
  z.string(),
  z.array(z.lazy(() => Proto)),
]);
export type Proto = null | number | string | boolean | Array<Proto>;

export const GameId = z.string().regex(/^[0-9a-f]+(rcp1)$/);
export const SkuId = z.string().regex(/^[0-9a-f]+(p)?$/);
export const OrganizationId = z.string().regex(/^[0-9a-f]+(pup1)$/);
export const PlayerId = z.string().regex(/^[1-9][0-9]*$/);
export const PlayerName = z.string().min(3).max(15);
export const PlayerNumber = z.string().length(4).regex(
  /^(0000|[1-9][0-9]{3})$/,
);

const ModelBase = z.object({
  proto: Proto.nullable(),
  type: z.string(),
});

export const Game = ModelBase.extend({
  type: z.literal("game"),
  gameId: GameId,
  name: z.string().nullable(),
});

export const SkuCommon = ModelBase.extend({
  type: z.literal("sku"),
  skuType: z.string().nullable(),
  skuId: SkuId,
  gameId: GameId.nullable(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  internalName: z.string().nullable(),
});

export const UnknownSku = SkuCommon.extend({
  skuType: z.null(),
  gameId: z.null(),
  name: z.null(),
  description: z.null(),
  internalName: z.null(),
});

export const GameSku = SkuCommon.extend({
  skuType: z.literal("game"),
});

export const AddonSku = SkuCommon.extend({
  skuType: z.literal("addon"),
});

export const BundleSku = SkuCommon.extend({
  skuType: z.literal("bundle"),
});

export const BundleSubscriptionSku = SkuCommon.extend({
  skuType: z.literal("bundle-subscription"),
});

export const AddonSubscriptionSku = SkuCommon.extend({
  skuType: z.literal("addon-subscription"),
});

export const PreorderSku = SkuCommon.extend({
  skuType: z.literal("preorder"),
});

export const Sku = z.union([
  UnknownSku,
  GameSku,
  AddonSku,
  BundleSku,
  BundleSubscriptionSku,
  AddonSubscriptionSku,
  PreorderSku,
]);
export type Sku = z.infer<typeof Sku>;

export const skuFromProto = (proto: Array<Proto>): Sku => {
  return Sku.parse({
    type: "sku",
    proto: proto,
    skuType: skuTypeFromId(z.number().parse(proto[6])),
    skuId: proto[0],
    gameId: proto[4] ?? null,
    name: proto[1],
    description: proto[9] ?? null,
    internalName: proto[5],
  });
};

export const skuTypeFromId = (id: number) => {
  let skuTypesById: Record<number, Sku["skuType"]> = {
    1: "game",
    2: "addon",
    3: "bundle",
    5: "bundle-subscription",
    6: "addon-subscription",
    10: "preorder",
  };
  return expect(skuTypesById[id]);
};

export const Player = ModelBase.extend({
  type: z.literal("player"),
  playerId: PlayerId,
  name: PlayerName.nullable(),
  number: PlayerNumber.nullable(),
  friendPlayerIds: PlayerId.array().nullable(),
  playedGameIds: GameId.array().nullable(),
});
export type Player = z.infer<typeof Player>;

export const Model = z.union([Sku, Game, Player]);
export type Model = z.infer<typeof Model>;
