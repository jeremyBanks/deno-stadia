export * from "./_shopify.ts";
export * from "./_rome.ts";
export * as as from "./_assert_static.ts";
export { assertStatic } from "./_assert_static.ts";

import * as rome from "./_rome.ts";
import * as shopify from "./_shopify.ts";
import * as as from "./_assert_static.ts";
import { assertStatic } from "./_assert_static.ts";

export default {
  ...rome,
  ...shopify,
  as,
  assertStatic,
};
