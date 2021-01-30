#!/usr/bin/env -S deno run --quiet --allow-read=/ --allow-write=/ --allow-net --allow-run --allow-env
export * from "./stadia/mod.ts";
export * as default from "./stadia/mod.ts";

import { main } from "./_cli/mod.ts";

if (import.meta.main) {
  await main(
    undefined,
    undefined,
    new URL(import.meta.url).protocol === "file:"
      ? "stadia"
      : `deno run --allow-all ${import.meta.url}`,
  );
}
