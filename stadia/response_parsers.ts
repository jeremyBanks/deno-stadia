/** Parsers from response proto types to corresponding local model types. */

// deno-lint-ignore-file no-explicit-any

import { zod as z } from "../deps.ts";
import * as response from "./response_protos.ts";
import * as models from "./models.ts";
import { expect, notImplemented } from "../_common/assertions.ts";

export const skuFromProto = z.any().transform((proto: any): models.Sku => {
  const skuType = skuTypeFromId.parse(z.number().parse(proto[6]));
  return models.SkuTypes[skuType].parse({
    type: "sku",
    proto: proto,
    skuType,
    skuId: proto[0],
    gameId: proto[4] ?? null,
    name: proto[1],
    description: proto[9] ?? null,
    internalName: proto[5],
    coverImageUrl: (proto[2] as any)?.[1]?.[0]?.[0]?.[1]?.split(/=/)[0],
    childSkuIds: (proto[14] as any)?.[0]?.map((x: any) => x[0]),
    timestampA: (proto[10] as any)?.[0] ?? null,
    timestampB: (proto[26] as any)?.[0] ?? null,
    publisherOrganizationId: proto[15],
    developerOrganizationIds: proto[16],
    subscriptionId: (proto[27] as any) ?? undefined,
  });
});

export const playerFromProto = z.any().transform((proto) => {
  return notImplemented();
});

export const skuTypeFromId = response.SkuTypeId.transform((id) =>
  models.SkuType.parse(
    expect(skuTypesById[id], `unexpected sku type id ${id}`),
  )
);

const skuTypesById: Record<response.SkuTypeId, models.SkuType> = {
  1: "Game",
  2: "Addon",
  3: "Bundle",
  4: "ExternalSubscription",
  5: "StadiaSubscription",
  6: "AddonSubscription",
  9: "AddonBundle",
  10: "PreorderBundle",
};
