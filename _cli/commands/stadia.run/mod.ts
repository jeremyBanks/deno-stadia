import { Client } from "../../../stadia/web_client/mod.ts";
import { FlagArgs, FlagOpts, log, types } from "../../../deps.ts";
import * as json from "../../../_common/json.ts";

import index from "./index.html.ts";
import manifest from "./manifest.json.ts";
import vercel from "./vercel.json.ts";

import { throttled } from "../../../_common/async.ts";

export const flags: FlagOpts = {
  string: ["name"],
  default: {
    "name": "stadia.run",
  },
};

let canvas: any;
try {
  // this is a huge import, so we put it here instead of ./deps since it's not
  // required for the library, only this command.
  canvas = await import("https://deno.land/x/canvas@v1.0.4/mod.ts");
} catch (error) {
  // this is bad but this is only for my use so
  let { proxy, revoke } = Proxy.revocable({}, {});
  revoke();
  canvas = proxy;
}

const loadImage = throttled(
  Math.E,
  async (s: string) => canvas.loadImage(s),
);

export type Games = types.ThenType<ReturnType<typeof command>>;

export const command = async (client: Client, flags: FlagArgs) => {
  const Canvas = canvas.default;

  const name = flags.name;

  const listPage = await client.fetchAllGames();

  log.debug("Loaded game list, processing and generating thumbnails...");

  const games = [];

  for (const game of listPage.skus) {
    if (game.type !== "game") {
      continue;
    }

    const image = await loadImage(game.coverImageUrl);
    const canvas = Canvas.MakeCanvas(8, 8);
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0, 8, 8);
    const pixels = context.getImageData(0, 0, 8, 8);

    const pixelDigits = new Array(64);
    for (let i = 0; i < 64; i++) {
      const [r, g, b] = pixels.data.slice(i * 4, i * 4 + 3);
      const u6 = rgbToU6([r, g, b]);
      pixelDigits.push(digits[u6]);
    }
    const coverThumbnailData = pixelDigits.join("");

    let {
      gameId,
      skuId,
      name,
      description,
      coverImageUrl,
      skuTimestampA,
      skuTimestampB,
    } = game;

    name = cleanName(name);
    skuTimestampA ??= 0;
    skuTimestampB ??= 0;

    const slug = slugify(name);

    log.debug(`Processed /${slug} ${name} ${gameId} ${coverThumbnailData}`);

    games.push({
      gameId,
      skuId,
      name,
      slug,
      description,
      coverThumbnailData,
      coverImageUrl,
      skuTimestampA,
      skuTimestampB,
    });
  }

  games.sort((a, b) =>
    Math.max(b.skuTimestampA, b.skuTimestampB) -
    Math.max(a.skuTimestampA, a.skuTimestampB)
  );

  log.debug("Games processed, rendering page.");

  Deno.writeTextFile("./stadia.run/index.json", json.encode({ games, name }));
  Deno.writeTextFile("./stadia.run/index.html", index.html({ games, name }));
  Deno.writeTextFile(
    "./stadia.run/manifest.json",
    manifest.json({ games, name }),
  );
  Deno.writeTextFile(
    "./stadia.run/vercel.json",
    vercel.json({ games }),
  );

  log.debug("Done");

  return games;
};

const digits =
  "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";

const cleanName = (name: string) =>
  name
    .replace(
      /^SpongeBobSquarePants:Battle for Bikini BottomRehydrated$/,
      "SpongeBob SquarePants: Battle for Bikini Bottom – Rehydrated",
    )
    .replace(/\bRe(mastered|hydrated|dux|make)$/gi, "")
    .replace(/\bTamriel Unlimited$/gi, "")
    .replace(/\bThe Official Videogame\b/gi, "")
    .replace(/^Tom Clancy's\b/gi, "")
    .replace(/:(\w)/g, " $1")
    .replace(/™/g, " ")
    .replace(/®/g, " ")
    .replace(/&/g, " and ")
    .replace(/[\:\-]? Early Access$/g, " ")
    .replace(/\bStandard Edition$/gi, " ")
    .replace(/[\:\-]? \w+ Edition$/g, " ")
    .replace(/\(\w+ Ver(\.|sion)\)$/g, " ")
    .replace(/\(\w+MODE\)$/g, " ")
    .replace(/™/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^\s+|\s+$/g, "");

const slugify = (name: string, separator = "-") =>
  cleanName(name)
    .normalize("NFKD")
    .replace(/[\u0300-\u0362]/gu, "")
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^\-+|\-+$/g, "")
    .replace(/\-/g, separator);

const rgbToU6 = (rgb: [number, number, number]): number => {
  const red = Math.round((0b11 * rgb[0]) / 0xff);
  const green = Math.round((0b11 * rgb[1]) / 0xff);
  const blue = Math.round((0b11 * rgb[2]) / 0xff);
  return (red << 0) + (green << 2) + (blue << 4);
};

const u6toRGB = (u6: number): [number, number, number] => {
  const red = (u6 & 0b000010 ? 0b10101010 : 0) +
    (u6 & 0b000001 ? 0b01010101 : 0);
  const green = (u6 & 0b001000 ? 0b10101010 : 0) +
    (u6 & 0b000100 ? 0b01010101 : 0);
  const blue = (u6 & 0b100000 ? 0b10101010 : 0) +
    (u6 & 0b010000 ? 0b01010101 : 0);
  return [red, green, blue];
};
