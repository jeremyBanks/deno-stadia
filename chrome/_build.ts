#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write
import { compress } from "https://deno.land/x/brotli@v0.1.4/mod.ts";

const main = async () => {
  if (new URL(import.meta.url).protocol === "file:") {
    // Operate in the same directory as this script.
    Deno.chdir(new URL(".", import.meta.url).pathname);
  } else {
    console.error("_build.ts can only be run locally (from a file: URL).");
    Deno.exit(1);
  }

  for (
    const cmd of [
      ["rustup", "--version"],
      ["cargo", "--version"],
      ["rustc", "--version"],
      ["cargo", "fmt"],
    ]
  ) {
    if (!await run(...cmd)) {
      console.log(`
  Suggestion:
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  `);
      Deno.exit(1);
    }
  }

  if (
    !await run(
      "wasm-pack",
      "build",
      // TODO: switch to new "deno" target in next version of wasm-pack.
      "--target=web",
      "--out-dir=target/wasm_pkg",
    )
  ) {
    console.log(`
  Suggestion:
    rustup target add wasm32-unknown-unknown
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
  `);
    throw Deno.exit(1);
  }

  if (
    !await run(
      "cargo",
      "build",
      "--release",
      "--bin",
      "windows",
      "--target=x86_64-pc-windows-gnu",
    )
  ) {
    console.log(`
  Suggestion:
    sudo apt install gcc-mingw-w64-x86-64
    rustup toolchain install stable-x86_64-pc-windows-gnu
    rustup target add x86_64-pc-windows-gnu
  `);
    throw Deno.exit(1);
  }

  await Deno.writeFile(
    "./_generated/crypto_bindings.js",
    await Deno.readFile("./target/wasm_pkg/crypto.js"),
  );

  await inlineBytes(
    "./_generated/crypto.wasm.js",
    await Deno.readFile("./target/wasm_pkg/crypto_bg.wasm"),
  );

  await inlineBytes(
    "./_generated/windows.exe.js",
    await Deno.readFile("./target/x86_64-pc-windows-gnu/release/windows.exe"),
  );

  await run("deno", "fmt");
};

/** Runs a command, logging any error, returning a boolean indicating success. */
const run = async (...cmd: string[]) => {
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

/** Writes a Uint8Array to an importable JS file. */
const inlineBytes = async (path: string | URL, bytes: Uint8Array) => {
  const compressedAndUgly = bytes.length > 131_072;

  if (compressedAndUgly) {
    bytes = compress(
      bytes,
      undefined,
      9,
    );
  }

  const lines = [];
  const bytesPerLine = 16;
  if (!compressedAndUgly) {
    lines.push(`\
/* deno-fmt-ignore-file deno-lint-ignore-file */ export default new Uint8Array([
/*******************************************************************************
*  OFFSET  *  0x0 0x1 0x2 0x3 0x4 0x5 0x6 0x7 0x8 0x9 0xA 0xB 0xC 0xD 0xE 0xF  *
********************************************************************************\
`);
  } else {
    lines.push(`\
// deno-fmt-ignore-file deno-lint-ignore-file
import { decompress } from "https://deno.land/x/brotli@v0.1.4/mod.ts";
export default decompress(new Uint8Array([\
`);
  }
  for (let offset = 0; offset < bytes.length; offset += bytesPerLine) {
    const formattedOffset = `0x${
      offset.toString(16).toUpperCase().padStart(6, "0")
    }`;

    let zeroes = 0;
    for (
      let probeOffset = offset;
      probeOffset < bytes.length;
      probeOffset += 1
    ) {
      if (bytes[probeOffset] === 0x00) {
        zeroes += 1;
      } else {
        break;
      }
    }

    const encodedBytes = [...bytes.slice(offset, offset + bytesPerLine)].map(
      (b) => `${b.toString().padStart(3)},`,
    ).join("");

    if (!compressedAndUgly) {
      lines.push(`* ${formattedOffset} */ ${encodedBytes.padEnd(64)}/*`);
    } else {
      lines.push(encodedBytes);
    }
  }

  if (!compressedAndUgly) {
    lines.push(`\
********************************************************************************
*  OFFSET  *  0x0 0x1 0x2 0x3 0x4 0x5 0x6 0x7 0x8 0x9 0xA 0xB 0xC 0xD 0xE 0xF  *
****************************************************************************/]);\
`);
  } else {
    lines.push(`]));\n`);
  }
  await Deno.writeTextFile(path, lines.join("\n"));
};

await main();
