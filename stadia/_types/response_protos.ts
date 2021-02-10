/** Proto types used in Stadia frontend RPC responses. */

import { z } from "../../_deps.ts";

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
export const SkuImages = z.unknown();
export const SkuInternalName = z.string().nonempty();
export const SkuDescription = z.string().nonempty();
export const SkuTimestampA = NullableTimestamp;
export const SkuTimestampB = NullableTimestamp;
export const SkuLanguages = z.unknown() ||
  z.string().nonempty().array().nonempty();
export const SkuCountries = z.unknown() ||
  z.string().nonempty().array().nonempty();
export const SkuPublisher = OrganizationId;
export const SkuDevelopers = OrganizationId.array().nonempty();

export const Sku = z.tuple([
  /*  0 */ SkuId,
  /*  1 */ SkuName,
  /*  2 */ SkuImages,
  /*  3 */ z.unknown(),
  /*  4 */ GameId.nullable(),
  /*  5 */ SkuInternalName,
  /*  6 */ SkuTypeId,
  /*  7 */ z.unknown(),
  /*  8 */ z.unknown(),
  /*  9 */ SkuDescription,
  /* 10 */ SkuTimestampA,
  /* 11 */ z.unknown(),
  /* 12 */ z.unknown(),
  /* 13 */ z.unknown(),
  /* 14 */ z.unknown(),
  /* 15 */ SkuPublisher,
  /* 16 */ SkuDevelopers,
  /* 17 */ z.unknown(),
  /* 18 */ z.unknown(),
  /* 19 */ z.unknown(),
  /* 20 */ z.unknown(),
  /* 21 */ z.unknown(),
  /* 22 */ z.unknown(),
  /* 23 */ z.unknown(),
  /* 24 */ SkuLanguages,
  /* 25 */ SkuCountries,
  /* 26 */ SkuTimestampB,
  /* 27 */ z.unknown(),
  /* 28 */ z.unknown(),
  /* 29 */ z.unknown(),
  /* 30 */ z.unknown(),
  /* 31 */ z.unknown(),
  /* 32 */ z.unknown(),
  /* 33 */ z.unknown(),
  /* 34 */ z.unknown(),
  /* 35 */ z.unknown(),
  /* 36 */ z.unknown(),
  /* 37 */ z.unknown(),
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
      z.unknown(),
      z.unknown(),
      z.unknown(),
      z.unknown(),
      z.unknown(),
      z.unknown(),
      PlayerId,
    ]),
    PlayerCanonicalName,
    z.unknown(),
    PlayerId,
    z.unknown(),
    z.unknown(),
  ]),
  z.unknown(),
  z.unknown(),
]);
