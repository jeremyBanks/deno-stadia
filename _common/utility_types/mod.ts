export * from "./_shopify.ts";
export * from "./_rome.ts";

import * as rome from "./_rome.ts";
import * as shopify from "./_shopify.ts";

export default {
  ...rome,
  ...shopify,
};

type Pass = { "assertStatic": "Pass" };
export const assertStatic: Pass = { "assertStatic": "Pass" };
type Fail<message extends string> = [`Fail<"${message}">`];

export type Extends<Type, Supertype> = Type extends Supertype ? Pass
  : Fail<`Type does not extend Supertype`>;

export type Equal<Left, Right> = Left extends Right ? Right extends Left ? Pass
: Fail<`Types are not equal, though Left extends Right.`>
  : Right extends Left ? Fail<`Types are not equal`>
  : Fail<`Types are not equal, though Right extends Left`>;
