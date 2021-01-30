/** Scalar types that are common to models and protos. */

import { z } from "../../_deps.ts";

const PositiveIntegerString = z.string().nonempty().regex(/^[1-9][0-9]*$/, {
  message: "string was not a positive integer",
});

export const GameId = z.string().regex(
  /^[0-9a-f]+(rcp1)$/,
  { message: "not a valid GameId" },
) as z.Schema<`${string}rcp1`>;
export const SkuId = z.string().regex(/^[0-9a-f]+(p)?$/, {
  message: "not a valid SkuId",
});
export const OrganizationId = z.string().regex(
  /^[0-9a-f]+(pup1)$/,
  { message: "not a valid OrganizationId" },
) as z.Schema<`${string}pup1`>;
export const PlayerId = PositiveIntegerString.min(4);
export const StoreListId = z.number().int().positive();
export const SubscriptionId = z.number().int().positive();
export const PlayerName = z.string().regex(/^[a-z][a-z0-9]{2,14}$/i, {
  message: "not a valid PlayerName",
});
export const GamertagPrefix = z.string().regex(
  /^[a-z][a-z0-9]{1,15}(#(([1-9][0-9]{0,3})|0{0,4})?)?$/,
  { message: "not a valid GamertagPrefix" },
);
export const PlayerNumber = z.string().regex(
  /^(0000|[1-9][0-9]{3})$/,
  { message: "not a valid PlayerNumber" },
);
export const CaptureId = z.string().uuid();
export const StateId = z.string().uuid();

export type GameId = z.infer<typeof GameId>;
export type SkuId = z.infer<typeof SkuId>;
export type OrganizationId = z.infer<typeof OrganizationId>;
export type SubscriptionId = z.infer<typeof SubscriptionId>;
export type PlayerId = z.infer<typeof PlayerId>;
export type StoreListId = z.infer<typeof StoreListId>;
export type PlayerName = z.infer<typeof PlayerName>;
export type GamertagPrefix = z.infer<typeof GamertagPrefix>;
export type PlayerNumber = z.infer<typeof PlayerNumber>;
export type CaptureId = z.infer<typeof CaptureId>;
export type StateId = z.infer<typeof StateId>;
