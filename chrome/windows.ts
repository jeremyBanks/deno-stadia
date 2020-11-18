import * as log from "https://deno.land/std@0.78.0/log/mod.ts";

const canonicalPath = new URL(`./target/x86_64-pc-windows-gnu/debug/windows.exe`, import.meta.url);
let localPath: URL;

if (new URL(import.meta.url).protocol !== "file:") {
  log.warning(`Downloading windows.exe from ${canonicalPath}, but verification and caching haven't been implemented yet.`);
  const response = await fetch(canonicalPath);
  const data = new Uint8Array(await response.arrayBuffer());
  localPath = new URL(`file://${await Deno.makeTempDir()}/windows.exe`);
  await Deno.writeFile(localPath, data, {mode: 0o555});
} else {
  localPath = canonicalPath;
}

export const cryptUnprotectData = async (
  ciphertext: Uint8Array,
): Promise<Uint8Array> => {
  const p = Deno.run({
    cmd: [localPath],
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
