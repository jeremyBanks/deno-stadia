import { sleep } from "./async.ts";
import { Json } from "./types.ts";

export const safeEval = async (
  javaScript: string,
): Promise<Json> => {
  const process = Deno.run({
    cmd: ["deno", "run", "-", javaScript],
    stdin: "piped",
    stdout: "piped",
  });
  const abortTimeout = new AbortController();

  return await Promise.race([
    (async () => {
      await Deno.writeAll(
        process.stdin,
        // XXX: This code is stringified and passed to the subprocess,
        // XXX: it is NOT executed actually executed in the scope where
        // XXX: it appears declared below.
        (new TextEncoder()).encode(`(${async () => {
          const [javaScript] = Deno.args;
          const value = await eval(javaScript);
          Deno.writeAll(
            Deno.stdout,
            ((new TextEncoder()).encode(JSON.stringify(value))),
          );
        }})();`),
      );
      process.stdin.close();
      const output = await process.output();
      Promise.resolve().then(() => abortTimeout.abort());
      if ((await process.status()).success) {
        return JSON.parse((new TextDecoder()).decode(output));
      } else {
        throw new SyntaxError("eval failed");
      }
    })(),
    (async () => {
      await sleep(16, abortTimeout.signal);
      process.close();
      throw new Error("eval timed out");
    })(),
  ]);
};
