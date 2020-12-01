export * from './shopify.ts';
export * from './rome.ts';

import * as rome from './rome.ts';
import * as shopify from './shopify.ts';

export default {
  ...rome,
  ...shopify
};
