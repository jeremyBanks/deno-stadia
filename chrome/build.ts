#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write
import { dirname } from "https://deno.land/std@0.78.0/path/mod.ts";

if (new URL(import.meta.url).protocol === "file:") {
  // Operate in the same directory as this script.
  Deno.chdir(dirname(new URL(import.meta.url).pathname));
} else {
  console.error("build-rust.ts can only be run locally (from a file: URL).");
  Deno.exit(1);
}

/** Runs a command, logging any error, returning a boolean indicating success. */
const ran = async (...cmd: string[]) => {
  console.info(cmd);

  let result;
  try {
    result = await Deno.run({ cmd }).status();
  } catch (error) {
    console.error(cmd, "failed with:", error);
    return false;
  }

  if (!result.success) {
    return false;
  } else {
    return true;
  }
};

for (
  const cmd of [
    ["rustup", "--version"],
    ["cargo", "--version"],
    ["rustc", "--version"],
    ["cargo", "fmt"],
  ]
) {
  if (!await ran(...cmd)) {
    console.log(`
Possible fix:
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
`);
    Deno.exit(1);
  }
}

if (!await ran("cargo", "build", "--lib", "--target=wasm32-unknown-unknown")) {
  console.log(`
Possible fix:
  rustup target add wasm32-unknown-unknown
`);
  throw Deno.exit(1);
}

if (
  !await ran(
    "cargo",
    "build",
    "--bin",
    "windows",
    "--target=x86_64-pc-windows-gnu",
  )
) {
  console.log(`
Possible fix:
  sudo apt install gcc-mingw-w64-x86-64
  rustup toolchain install stable-x86_64-pc-windows-gnu
  rustup target add x86_64-pc-windows-gnu
`);
  throw Deno.exit(1);
}

const cryptoWasm = await Deno.readFile(
  "target/wasm_pkg/crypto_bg.wasm",
);
const cryptoWasmTsLines = [
  `/** @generated deno-fmt-ignore-file deno-lint-ignore-file //-//*/
import init from "./target/wasm_pkg/crypto.js"; export { //-//*/
  aes_gcm_256_decrypt_and_verify_as_utf8 as //////////////
    aesGcm256DecryptAndVerifyAsUtf8,     ////
  sha_512_trunc_256_hex as              //
    sha512trunc256Hex,                 //
} from "./target/wasm_pkg/crypto.js"; //
await init(new Uint8Array([          ////////////////////////////// OFFSET`,
];
for (let i = 0; i < cryptoWasm.length; i += 16) {
  cryptoWasmTsLines.push(
    ([...cryptoWasm.slice(i, i + 16)].map((n) => String(n).padStart(3)).join(
      ",",
    ) + ",").padEnd(64) +
      ` // ${
        String(i).padStart(
          Math.max("OFFSET".length, String(cryptoWasm.length).length),
        )
      }`,
  );
}

cryptoWasmTsLines.push(
  `] as any).buffer); /*//-//////////////////////////////////////////  OFFSET
///////////////////*//-/
`,
);
await Deno.writeTextFile("./crypto.ts", cryptoWasmTsLines.join("\n"));

if (
  !await ran(
    "wasm-pack",
    "build",
    "--target=web",
    "--out-dir=target/wasm_pkg",
  )
) {
  console.log(`
Possible solution:
  curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
`);
  throw Deno.exit(1);
}

await ran("deno", "fmt");
