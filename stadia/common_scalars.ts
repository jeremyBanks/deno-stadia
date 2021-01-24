/** Scalar types that are common to models and protos. */

import { zod as z } from "../deps.ts";

const PositiveIntegerString = z.string().nonempty().regex(/^[1-9][0-9]*$/);

export const GameId = z.string().regex(
  /^[0-9a-f]+(rcp1)$/,
) as z.Schema<`${string}rcp1`>;
export const SkuId = z.string().regex(/^[0-9a-f]+(p)?$/);
export const OrganizationId = z.string().regex(
  /^[0-9a-f]+(pup1)$/,
) as z.Schema<`${string}pup1`>;
export const PlayerId = PositiveIntegerString;
export const StoreListId = PositiveIntegerString;
export const PlayerName = z.string().min(3).max(15);
export const PlayerNumber = z.string().length(4).regex(
  /^(0000|[1-9][0-9]{3})$/,
);
export const GUID = z.string().regex(
  /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/,
);
export const CaptureId = GUID;
export const StateId = GUID;

export type GameId = z.infer<typeof GameId>;
export type SkuId = z.infer<typeof SkuId>;
export type OrganizationId = z.infer<typeof OrganizationId>;
export type PlayerId = z.infer<typeof PlayerId>;
export type StoreListId = z.infer<typeof StoreListId>;
export type PlayerName = z.infer<typeof PlayerName>;
export type PlayerNumber = z.infer<typeof PlayerNumber>;
export type CaptureId = z.infer<typeof CaptureId>;
export type StateId = z.infer<typeof StateId>;
