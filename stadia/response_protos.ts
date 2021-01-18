/** Proto types used in Stadia frontend RPC responses. */

import { z } from "../../deps.ts";
import { Proto } from "../../_common/proto.ts";

const UNKNOWN = Proto;

export const GameId = z.string().regex(/^[0-9a-f]+(rcp1)$/);
export const SkuId = z.string().regex(/^[0-9a-f]+(p)?$/);
export const OrganizationId = z.string().regex(/^[0-9a-f]+(pup1)$/);

export const SkuTypeId = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(9),
  z.literal(10),
]);
export type SkuTypeId = z.infer<typeof SkuTypeId>;

export const NullableTimestamp = z.union([
  z.tuple([z.number().int().positive()]),
  z.tuple([]),
]).nullable();
export const SkuName = z.string().nonempty();
export const SkuImages = UNKNOWN;
export const SkuInternalName = z.string().nonempty();
export const SkuDescription = z.string().nonempty();
export const SkuTimestampA = NullableTimestamp;
export const SkuTimestampB = NullableTimestamp;
export const SkuLanguages = UNKNOWN || z.string().nonempty().array().nonempty();
export const SkuCountries = UNKNOWN || z.string().nonempty().array().nonempty();
export const SkuPublisher = OrganizationId;
export const SkuDevelopers = OrganizationId.array().nonempty();

export let Sku = z.tuple([
  /*  0 */ SkuId,
  /*  1 */ SkuName,
  /*  2 */ SkuImages,
  /*  3 */ UNKNOWN,
  /*  4 */ GameId.nullable(),
  /*  5 */ SkuInternalName,
  /*  6 */ SkuTypeId,
  /*  7 */ UNKNOWN,
  /*  8 */ UNKNOWN,
  /*  9 */ SkuDescription,
  /* 10 */ SkuTimestampA,
  /* 11 */ UNKNOWN,
  /* 12 */ UNKNOWN,
  /* 13 */ UNKNOWN,
  /* 14 */ UNKNOWN,
  /* 15 */ SkuPublisher,
  /* 16 */ SkuDevelopers,
  /* 17 */ UNKNOWN,
  /* 18 */ UNKNOWN,
  /* 19 */ UNKNOWN,
  /* 20 */ UNKNOWN,
  /* 21 */ UNKNOWN,
  /* 22 */ UNKNOWN,
  /* 23 */ UNKNOWN,
  /* 24 */ SkuLanguages,
  /* 25 */ SkuCountries,
  /* 26 */ SkuTimestampB,
  /* 27 */ UNKNOWN,
  /* 28 */ UNKNOWN,
  /* 29 */ UNKNOWN,
  /* 30 */ UNKNOWN,
  /* 31 */ UNKNOWN,
  /* 32 */ UNKNOWN,
  /* 33 */ UNKNOWN,
  /* 34 */ UNKNOWN,
  /* 35 */ UNKNOWN,
  /* 36 */ UNKNOWN,
  /* 37 */ UNKNOWN,
]);

export const PlayerId = z.string().regex(/^\d+$/);
export const AvatarId = z.string().regex(/^s000\d\d$/);
export const AvatarUrl = z.string().url();
export const PlayerName = z.string().min(3).max(15);
export const PlayerNumber = z.string().length(4).regex(
  /^(0000|[1-9][0-9]{3})$/,
);
export const PlayerCanonicalName = z.string().regex(
  /^[A-Z0-9]{3,15}(_[1-9][0-9]{3})?$/,
);
export const Player = z.tuple([
  z.null(),
  z.null(),
  z.null(),
  z.null(),
  z.null(),
  z.tuple([
    z.tuple([PlayerName, PlayerNumber]),
    z.tuple([AvatarId, AvatarUrl]),
    z.tuple([
      z.tuple([PlayerName, PlayerNumber]),
      UNKNOWN,
      UNKNOWN,
      UNKNOWN,
      UNKNOWN,
      UNKNOWN,
      UNKNOWN,
      PlayerId,
    ]),
    PlayerCanonicalName,
    UNKNOWN,
    PlayerId,
    UNKNOWN,
    UNKNOWN,
  ]),
  UNKNOWN,
  UNKNOWN,
]);
