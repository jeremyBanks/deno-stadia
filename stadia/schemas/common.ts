import { zod as z } from "../../deps.ts";

export const GameId = z.string().regex(/^[0-9a-f]+(rcp1)$/);
export type GameId = z.infer<typeof GameId>;
export const SkuId = z.string().regex(/^[0-9a-f]+(p)?$/);
export type SkuId = z.infer<typeof SkuId>;
export const OrganizationId = z.string().regex(/^[0-9a-f]+(pup1)$/);
export type OrganizationId = z.infer<typeof OrganizationId>;
export const PlayerId = z.string().regex(/^[1-9][0-9]*$/);
export type PlayerId = z.infer<typeof PlayerId>;
export const PlayerName = z.string().min(3).max(15);
export type PlayerName = z.infer<typeof PlayerName>;
export const PlayerNumber = z.string().length(4).regex(
  /^(0000|[1-9][0-9]{3})$/,
);
export type PlayerNumber = z.infer<typeof PlayerNumber>;
