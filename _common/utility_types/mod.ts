export * from "./_shopify.ts";
export * from "./_rome.ts";

import * as rome from "./_rome.ts";
import * as shopify from "./_shopify.ts";

export default {
  ...rome,
  ...shopify,
};
