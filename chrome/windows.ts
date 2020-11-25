import { log } from "../deps.ts";

import { getTempDir } from "../_common/paths.ts";

import { sha512trunc256Hex } from "./crypto.ts";

import exe from "./_generated/windows.exe.js";

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

let localPath: Promise<URL> | undefined;

const getLocalPath = async () =>
  localPath ??= (async () => {
    const expectedDigest = sha512trunc256Hex(exe);

    const localPath = new URL(
      `file://${getTempDir()}/deno-stadia-windows-${
        expectedDigest.slice(0, 4)
      }.exe`,
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
        `Writing windows.exe to ${localPath}.`,
      );
      await Deno.writeFile(localPath, exe, { mode: 0o555 });
    }

    return localPath;
  })();
