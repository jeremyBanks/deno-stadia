import { sleep, throttled } from "./async.ts";
import { Json } from "./types.ts";

export const safeEval = throttled(0.125, async (
  javaScript: string,
): Promise<Json> => {
  const process = Deno.run({
    cmd: ["deno", "run", "--no-check", "--quiet", "-"],
    stdin: "piped",
    stdout: "piped",
  });
  const abortTimeout = new AbortController();

  return await Promise.race([
    (async () => {
      await Deno.writeAll(
        process.stdin,
        (new TextEncoder()).encode(`(async () => {
          const value = await (async () => (
            ${javaScript}
          ))();
          Deno.writeAll(
            Deno.stdout,
            ((new TextEncoder()).encode(JSON.stringify(value))),
          );
        })();`),
      );
      process.stdin.close();
      const output = (new TextDecoder()).decode(await process.output());
      try {
        if ((await process.status()).success) {
          return JSON.parse(output);
        } else {
          throw new SyntaxError("eval failed");
        }
      } finally {
        Promise.resolve().then(() => abortTimeout.abort());
      }
    })(),
    (async () => {
      await sleep(4, abortTimeout.signal);
      process.close();
      throw new Error("eval timed out");
    })(),
  ]);
});
