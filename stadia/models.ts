/** Local model types. */

import { z } from "../deps.ts";
import {
  GameId,
  OrganizationId,
  PlayerId,
  PlayerName,
  PlayerNumber,
  SkuId,
} from "./common_scalars.ts";
import { SkuTypeId } from "./response_protos.ts";

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
  skuType: z.literal("Game"),
});

export const AddonSku = SkuCommon.extend({
  skuType: z.literal("Addon"),
});

export const BundleSku = SkuCommon.extend({
  skuType: z.literal("Bundle"),
});

export const BundleSubscriptionSku = SkuCommon.extend({
  skuType: z.literal("BundleSubscription"),
});

export const ExternalSubscriptionSku = SkuCommon.extend({
  skuType: z.literal("ExternalSubscription"),
});

export const AddonSubscriptionSku = SkuCommon.extend({
  skuType: z.literal("AddonSubscription"),
});

export const AddonBundleSku = SkuCommon.extend({
  skuType: z.literal("AddonBundle"),
});

export const PreorderSku = SkuCommon.extend({
  skuType: z.literal("Preorder"),
});

export const PreorderBundleSku = SkuCommon.extend({
  skuType: z.literal("PreorderBundle"),
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
  PreorderBundleSku,
]);
export type Sku = z.infer<typeof Sku>;

export const SkuTypes = {
  Game: GameSku,
  Addon: AddonSku,
  Bundle: BundleSku,
  BundleSubscription: BundleSubscriptionSku,
  AddonSubscription: AddonSubscriptionSku,
  AddonBundle: AddonBundleSku,
  ExternalSubscription: ExternalSubscriptionSku,
  Preorder: PreorderSku,
  PreorderBundle: PreorderBundleSku,
  Unknown: UnknownSku,
} as const;

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
