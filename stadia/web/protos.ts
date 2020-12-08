import { z } from "../../deps.ts";

export const Proto: z.ZodSchema<Proto> = z.union([
  z.null(),
  z.number(),
  z.string(),
  z.array(z.lazy(() => Proto)),
]);
export type Proto = null | number | string | boolean | Proto[];

export const OrganizationId = z.string().nonempty();
export const Timestamp = z.tuple([z.number().int().positive()]);

export const SkuId = z.string().nonempty();
export const GameId = z.string().nonempty().nullable();
export const SkuName = z.string().nonempty();
export const SkuImages = z.unknown();
export const SkuInternalName = z.string().nonempty();
export const SkuTypeId = z.number().positive().int();
export const SkuDescription = z.string().nonempty();
export const SkuPublicationDate = Timestamp;
export const SkuUpdateDate = Timestamp.nullable();
export const SkuLanguages = z.string().nonempty().array().nonempty();
export const SkuCountries = z.string().nonempty().array().nonempty();
export const SkuPublisher = OrganizationId;
export const SkuDevelopers = OrganizationId.array().nonempty();
export const Sku = z.tuple([
  /*  0 */ SkuId,
  /*  1 */ SkuName,
  /*  2 */ SkuImages,
  /*  3 */ z.unknown(),
  /*  4 */ GameId,
  /*  5 */ SkuInternalName,
  /*  6 */ SkuTypeId,
  /*  7 */ z.unknown(),
  /*  8 */ z.unknown(),
  /*  9 */ SkuDescription,
  /* 10 */ SkuPublicationDate,
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
  /* 26 */ SkuUpdateDate,
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
]);
