import { z } from "../../deps.ts";
import { expect } from "../../_common/assertions.ts";
import { Json } from "../../_common/json.ts";
import { Proto } from "./_common.ts";
import { GameId, OrganizationId, SkuId } from "./_common.ts";

export const SkuType = z.enum([
  "Game",
  "Addon",
  "Bundle",
  "ExternalSubscription",
  "BundleSubscription",
  "AddonSubscription",
  "AddonBundle",
  "PreorderBundle",
]);
export type SkuType = z.infer<typeof SkuType>;

const ModelBase = z.object({
  proto: z.unknown().nullable(),
  type: z.string(),
});

export const Game = ModelBase.extend({
  type: z.literal("game"),
  gameId: GameId,
  skuId: SkuId.nullable(),
  name: z.string().nullable(),
});
export type Game = z.infer<typeof Game>;

export const SkuCommon = ModelBase.extend({
  type: z.literal("sku"),
  skuType: z.string().nullable(),
  skuId: SkuId,
  gameId: GameId.nullable(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  internalName: z.string().nullable(),
  coverImageUrl: z.string().nullable().optional(),
  timestampA: z.number().nullable().optional(),
  timestampB: z.number().nullable().optional(),
  publisherOrganizationId: OrganizationId.nullable().optional(),
  developerOrganizationIds: OrganizationId.array().nullable().optional(),
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

export const ExternalSubscriptionSku = SkuCommon.extend({
  skuType: z.literal("external-subscription"),
});

export const AddonSubscriptionSku = SkuCommon.extend({
  skuType: z.literal("addon-subscription"),
});

export const AddonBundleSku = SkuCommon.extend({
  skuType: z.literal("addon-bundle"),
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
  AddonBundleSku,
  ExternalSubscriptionSku,
  PreorderSku,
]);
export type Sku = z.infer<typeof Sku>;

export const Player = ModelBase.extend({
  type: z.literal("player"),
  playerId: PlayerId,
  name: PlayerName.nullable(),
  number: PlayerNumber.nullable(),
});
export type Player = z.infer<typeof Player>;

export const PlayerFriends = ModelBase.extend({
  type: z.literal("player.friends"),
  playerId: PlayerId,
  friendPlayerIds: PlayerId.array().nullable(),
});
export type PlayerFriends = z.infer<typeof PlayerFriends>;

export const PlayerGames = ModelBase.extend({
  type: z.literal("player.games"),
  playerId: PlayerId,
  playedGameIds: GameId.array().nullable(),
});
export type PlayerGames = z.infer<typeof PlayerGames>;

export const PlayerGameStats = ModelBase.extend({
  type: z.literal("player.gamestats"),
  playerId: PlayerId,
  stats: z.unknown(),
});
export type PlayerGameStats = z.infer<typeof PlayerGameStats>;

export const Model = z.union(
  [Sku, Game, Player, PlayerFriends, PlayerGames, PlayerGameStats],
);
export type Model = z.infer<typeof Model>;
