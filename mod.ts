#!/usr/bin/env -S deno run --allow-read=/ --allow-write=/ --allow-net=stadia.google.com --allow-run
import { main } from "./cli.ts";

if (import.meta.main) {
  await main(
    undefined,
    undefined,
    new URL(import.meta.url).protocol === "file:"
      ? "stadia"
      : `deno run --allow-all ${import.meta.url}`,
  );
}

export * as chrome from "./chrome/mod.ts";
