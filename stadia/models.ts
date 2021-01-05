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

export const MaybeFromProto = z.object({
  proto: Proto.optional(),
});

export const Game = MaybeFromProto.extend({
  gameId: GameId,
  name: z.string().optional(),
});
``;

export const SkuCommon = MaybeFromProto.extend({
  skuType: z.string(),
  skuId: SkuId,
  gameId: GameId.optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  internalName: z.string().optional(),
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
    proto: proto,
    skuType: skuTypeFromId(z.number().parse(proto[6])),
    skuId: proto[0],
    gameId: proto[4] ?? undefined,
    name: proto[1],
    description: proto[9] ?? undefined,
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

export const Player = MaybeFromProto.extend({
  playerId: PlayerId,
  name: PlayerName,
  number: PlayerNumber,
  friendPlayerIds: PlayerId.array().optional(),
  playedGameIds: GameId.array().optional(),
});
