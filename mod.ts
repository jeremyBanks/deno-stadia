#!/usr/bin/env -S deno run --allow-read=/ --allow-write=/ --allow-net=stadia.google.com --allow-run
import { main } from "./cli.ts";

if (import.meta.main) {
  await main();
}

export * as chrome from "./chrome/mod.ts";
