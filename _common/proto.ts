import { z } from "../_deps.ts";

export const ProtoPrimitive = z.union([
  z.null(),
  z.number(),
  z.string(),
  z.boolean(),
]);
export type ProtoPrimitive = z.infer<typeof ProtoPrimitive>;

export const ProtoMessage = z.array(z.union([
  z.null(),
  z.number(),
  z.string(),
  z.boolean(),
  // The considerable it would take to deeply type-checking every incoming
  // structure isn't worth it for this this relatively-broad type information,
  // so we only check the top-level array of a ProtoMessage.
  z.array(z.unknown()),
])).nullable();
export type ProtoMessage = z.infer<typeof ProtoMessage>;

export const DeepProto: z.ZodSchema<DeepProto> = z.union([
  ProtoPrimitive,
  z.array(z.lazy(() => DeepProto)),
]);
export type DeepProto = ProtoPrimitive | Array<DeepProto>;
