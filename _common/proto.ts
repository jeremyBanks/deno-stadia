import { zod as z } from "../deps.ts";

export type Proto = null | number | string | boolean | Array<Proto>;
export const Proto: z.ZodSchema<Proto> = z.union([
  z.null(),
  z.number(),
  z.string(),
  z.boolean(),
  z.array(z.lazy(() => Proto)),
]);

export const ProtoMessage = Proto.array().nullable();
export type ProtoMessage = z.infer<typeof ProtoMessage>;
