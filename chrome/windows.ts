import { dirname } from "https://deno.land/std@0.78.0/path/mod.ts";

let dir: string | Error;
if (new URL(import.meta.url).protocol === "file:") {
  dir = dirname(new URL(import.meta.url).pathname);
} else {
  dir = new Error("windows.ts can only be used locally (from a file: URL).");
}

export const cryptUnprotectData = async (
  ciphertext: Uint8Array,
): Promise<Uint8Array> => {
  if (dir instanceof Error) {
    throw dir;
  }

  const p = Deno.run({
    cmd: [`${dir}/target/x86_64-pc-windows-gnu/debug/windows.exe`],
    stdin: "piped",
    stdout: "piped",
  });

  await Deno.writeAll(p.stdin, ciphertext);
  p.stdin.close();
  const cleartext = await p.output();
  const status = await p.status();

  if (!status.success) {
    throw new Error(
      `decryption failed (code ${status.code}, sig ${status.signal}`,
    );
  }

  return cleartext;
};
