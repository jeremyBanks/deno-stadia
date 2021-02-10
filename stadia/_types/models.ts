/** Local model types. */

import { z } from "../../_deps.ts";
import {
  GameId,
  OrganizationId,
  PlayerId,
  PlayerName,
  PlayerNumber,
  SkuId,
  SubscriptionId,
} from "./common_scalars.ts";
import { SkuTypeId } from "./response_protos.ts";

export const SkuType = z.enum([
  "Game",
  "Addon",
  "Bundle",
  "ExternalSubscription",
  "StadiaSubscription",
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
export const GameSku = SkuCommon.extend({
  skuType: z.literal("Game"),
});

export const AddonSku = SkuCommon.extend({
  skuType: z.literal("Addon"),
});

export const BundleSku = SkuCommon.extend({
  skuType: z.literal("Bundle"),
});

export const StadiaSubscriptionSku = SkuCommon.extend({
  skuType: z.literal("StadiaSubscription"),
  subscriptionId: SubscriptionId,
});

export const ExternalSubscriptionSku = SkuCommon.extend({
  skuType: z.literal("ExternalSubscription"),
  subscriptionId: SubscriptionId,
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

const NonSkuSkuCommon = SkuCommon.extend({
  gameId: z.null(),
  name: z.null(),
  description: z.null(),
  internalName: z.null(),
  coverImageUrl: z.null(),
  timestampA: z.null(),
  timestampB: z.null(),
  publisherOrganizationId: z.null(),
  developerOrganizationIds: z.null(),
});

export const AliasSku = NonSkuSkuCommon.extend({
  skuType: z.literal("Alias"),
  targetSkuId: SkuId,
});

export const DeletedSku = NonSkuSkuCommon.extend({
  skuType: z.literal("Deleted"),
});

export const Sku = z.union([
  AddonBundleSku,
  AddonSku,
  AddonSubscriptionSku,
  AliasSku,
  DeletedSku,
  BundleSku,
  StadiaSubscriptionSku,
  ExternalSubscriptionSku,
  GameSku,
  PreorderBundleSku,
  PreorderSku,
]);
export type Sku = z.infer<typeof Sku>;
export type AliasSku = z.infer<typeof AliasSku>;
export type DeletedSku = z.infer<typeof DeletedSku>;

export const SkuTypes = {
  Addon: AddonSku,
  AddonBundle: AddonBundleSku,
  AddonSubscription: AddonSubscriptionSku,
  Alias: AliasSku,
  Deleted: DeletedSku,
  Bundle: BundleSku,
  StadiaSubscription: StadiaSubscriptionSku,
  ExternalSubscription: ExternalSubscriptionSku,
  Game: GameSku,
  Preorder: PreorderSku,
  PreorderBundle: PreorderBundleSku,
} as const;

export const Player = ModelBase.extend({
  type: z.literal("player"),
  avatarImageUrl: z.string(),
  playerId: PlayerId,
  name: PlayerName,
  number: PlayerNumber,
  playedGameIds: GameId.array().nullable().optional(),
  friendPlayerIds: PlayerId.array().nullable().optional(),
});
export type Player = z.infer<typeof Player>;

export const Model = z.union(
  [Sku, Game, Player],
);
export type Model = z.infer<typeof Model>;
