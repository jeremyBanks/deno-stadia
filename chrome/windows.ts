import * as log from "https://deno.land/std@0.78.0/log/mod.ts";

import { sha512trunc256Hex } from "./crypto.ts";

const expectedDigest =
  "0081c7274f20500de453d0a92b0b8b8d7236c3d396e2aadd82c24485a01a5d91";

const canonicalPath = new URL(
  `./target/x86_64-pc-windows-gnu/debug/windows.exe`,
  import.meta.url,
);

let localPath: Promise<URL> | undefined;
export const cryptUnprotectData = async (
  ciphertext: Uint8Array,
): Promise<Uint8Array> => {
  const p = Deno.run({
    cmd: [await getLocalPath()],
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

const getLocalPath = async () =>
  localPath ??= (async () => {
    let localPath;
    if (new URL(import.meta.url).protocol !== "file:") {
      localPath = new URL(
        `file:///tmp/deno-stadia-windows-${expectedDigest.slice(0, 4)}.exe`,
      );

      let existingDigest;
      try {
        existingDigest = sha512trunc256Hex(await Deno.readFile(localPath));
      } catch (error) {
        log.debug(`There appears to be no existing ${localPath}: ${error}.`);
      }

      if (existingDigest && existingDigest === expectedDigest) {
        log.debug(
          `Verified existing ${localPath} as matching expected hash (${expectedDigest}).`,
        );
      } else {
        if (existingDigest) {
          log.warning(
            `Found existing ${localPath}, but its hash (${existingDigest}) did not match the expected value ${expectedDigest}.`,
          );
        }
        log.info(
          `Downloading windows.exe from ${canonicalPath} to ${localPath}.`,
        );
        const response = await fetch(canonicalPath);
        const data = new Uint8Array(await response.arrayBuffer());
        const actualDigest = sha512trunc256Hex(data);
        if (actualDigest !== expectedDigest) {
          log.error(
            `Hash of downloaded windows.exe (${actualDigest}) doesn't match the expected value (${expectedDigest}).`,
          );
          throw Deno.exit(1);
        }
        await Deno.writeFile(localPath, data, { mode: 0o555 });
      }
    } else {
      localPath = canonicalPath;
      const actualDigest = sha512trunc256Hex(await Deno.readFile(localPath));
      if (actualDigest !== expectedDigest) {
        log.warning(
          `Hash of local windows.exe (${actualDigest}) doesn't match the expected value (${expectedDigest}).`,
        );
      }
    }
    return localPath;
  })();
