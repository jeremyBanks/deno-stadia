export { deferred } from "https://deno.land/std@0.79.0/async/deferred.ts";
export * as color from "https://deno.land/std@0.79.0/fmt/colors.ts";
export * as flags from "https://deno.land/std@0.79.0/flags/mod.ts";
export type {
  ArgParsingOptions as FlagOpts,
  Args as FlagArgs,
} from "https://deno.land/std@0.79.0/flags/mod.ts";
export { Sha3_256 as Sha3d256 } from "https://deno.land/std@0.79.0/hash/sha3.ts";
export { BufReader, BufWriter } from "https://deno.land/std@0.78.0/io/bufio.ts";
export * as log from "https://deno.land/std@0.78.0/log/mod.ts";
export * as path from "https://deno.land/std@0.79.0/path/mod.ts";

export * as brotli from "https://deno.land/x/brotli@v0.1.4/mod.ts";
export {
  Database,
  default as SQL,
  SQLExpression,
} from "https://deno.land/x/lite@0.0.9/sql.ts";

// TODO: use official Deno release once it exists: https://github.com/colinhacks/zod/pull/209
export * as z from "https://cdn.jsdelivr.net/gh/jeremyBanks/zod@421560fd8cea/mod.ts";
