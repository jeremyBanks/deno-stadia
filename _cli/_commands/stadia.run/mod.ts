import { Client } from "../../../stadia/client.ts";
import { FlagArgs, FlagOpts, log } from "../../../deps.ts";
import * as json from "../../../_common/json.ts";

import index from "./index.html.ts";
import manifest from "./manifest.json.ts";
import vercel from "./vercel.json.ts";

import { throttled } from "../../../_common/async.ts";
import { ThenType } from "../../../_common/utility_types/mod.ts";
import { expect } from "../../../_common/assertions.ts";

export const flags: FlagOpts = {
  string: ["name"],
  default: {
    "name": "stadia.run",
  },
};

let canvas: any;

const loadImage = throttled(
  Math.E,
  async (s: string) => canvas.loadImage(s),
);

export type Game = {
  gameId: string;
  skuId: string;
  name: string;
  storeName: string;
  slug: string;
  description: string;
  coverThumbnailData: string;
  coverImageUrl: string;
  timestampA: number;
  timestampB: number;
  inStadiaPro: boolean;
  inUbisoftPlus: boolean;
};

export type Games = Array<Game>;

export const command = async (client: Client, flags: FlagArgs) => {
  try {
    // this is a huge import, so we put it here instead of ./deps since it's not
    // required for the library, only this command.
    canvas ??= await import("https://deno.land/x/canvas@v1.0.4/mod.ts");
  } catch (error) {
    // this is bad but this is only for my use, so
    let { proxy, revoke } = Proxy.revocable({}, {});
    revoke();
    canvas = proxy;
  }

  const Canvas = canvas.default;

  const name = flags.name;

  // TODO: replace this with something based on the new spider client model
  // TODO: make the spider threads cancellable using an AbortSignal.
  const allGamesListPage = await client.fetchStoreList(3);
  const stadiaProListPage = await client.fetchStoreList(2001);
  const ubisoftPlusListPage = await client.fetchStoreList(2002);

  const stadiaProGameIds = new Set(
    stadiaProListPage.map((x) => x.gameId).filter(Boolean),
  );
  const ubisoftPlusGameIds = new Set(
    ubisoftPlusListPage.map((x) => x.gameId).filter(Boolean),
  );

  log.debug("Loaded game list, processing and generating thumbnails...");

  const games: Games = [];

  for (const game of allGamesListPage) {
    if (game.skuType !== "Game") {
      continue;
    }

    const image = await loadImage(game.coverImageUrl!);
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
      timestampA,
      timestampB,
    } = game;

    const storeName: string = expect(name);
    name = cleanName(storeName);
    timestampA ??= 0;
    timestampB ??= 0;

    const inStadiaPro = stadiaProGameIds.has(gameId);
    const inUbisoftPlus = ubisoftPlusGameIds.has(gameId);

    const slug = slugify(storeName!);

    log.debug(`Processed /${slug} ${name} ${gameId} ${coverThumbnailData}`);

    const g: Game = {
      gameId: expect(gameId),
      skuId,
      name,
      storeName,
      slug,
      description: description!,
      coverThumbnailData,
      coverImageUrl: coverImageUrl!,
      timestampA,
      timestampB,
      inStadiaPro,
      inUbisoftPlus,
    };
    games.push(g);
  }

  games.sort((a, b) =>
    Math.max(b.timestampA, b.timestampB) -
    Math.max(a.timestampA, a.timestampB)
  );

  log.debug("Games processed, rendering page.");

  Deno.writeTextFile(
    "./stadia.run/index.json",
    json.encode({ games, name }, 2),
  );
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

export const cleanName = (name: string) =>
  name
    .replace(
      /^SpongeBobSquarePants:Battle for Bikini BottomRehydrated$/,
      "SpongeBob SquarePants: Battle for Bikini Bottom - Rehydrated",
    )
    .replace(/’/g, "'")
    .replace(/\bRe(mastered|hydrated|dux|make)$/gi, "")
    .replace(/\bTamriel Unlimited$/gi, "")
    .replace(/- The Official Videogame\b/gi, "")
    .replace(/^Tom Clancy's/gi, "")
    .replace(/^STAR WARS/gi, "Star Wars")
    .replace(/^Dragon Ball Xenoverse/gi, "Dragon Ball Xenoverse")
    .replace(/^WATCH_DOGS/gi, "Watch Dogs")
    .replace(/^OCTOPATH TRAVELER/gi, "Octopath Traveler")
    .replace(/^DOOM/gi, "Doom")
    .replace(/^Samurai Shodown/gi, "Samurai Shodown")
    .replace(
      /^PlayerUnknown's Battlegrounds/gi,
      "PlayerUnknown's Battlegrounds",
    )
    .replace(/^Final Fantasy/gi, "Final Fantasy")
    .replace(/™/g, " ")
    .replace(/®/g, " ")
    .replace(/[\:\-]? Early Access$/g, " ")
    .replace(/\bStandard Edition$/gi, " ")
    .replace(/[\:\-]? \w+ Edition$/g, " ")
    .replace(/\(\w+ Ver(\.|sion)\)$/g, " ")
    .replace(/\(\w+MODE\)$/g, " ")
    .replace(/: 20 Year Celebration$/, "")
    .replace(/\bStadia\b/gi, "")
    .replace(/:(\w)/g, ": $1")
    .replace(/(\w)\s+:/g, "$1:")
    .replace(/\s{2,}/g, " ")
    .replace(/(^[\- :]+)|([\- :]+$)/g, "");

export const slugify = (name: string, separator = "-") =>
  cleanName(name)
    .replace(/é/g, "e")
    .normalize("NFKD")
    .replace(/[\u0300-\u0362]/g, "")
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^[\- :]+)|([\- :]+$)/g, "")
    .replace(/^(hitman)-world-of-assassination$/g, "$1")
    .replace(/^(sekiro)-shadows-die-twice$/g, "$1")
    .replace(/^(hotline-miami-2)-wrong-number$/g, "$1")
    .replace(/^(rock-of-ages-3)-make-and-break$/g, "$1")
    .replace(/^(monster-boy)-and-the-cursed-kingdom$/g, "$1")
    .replace(/^(zombie-army-4)-dead-war$/g, "$1")
    .replace(/^playerunknowns-battlegrounds$/g, "pubg")
    .replace(/^(steamworld-quest)-hand-of-gilgamech$/g, "$1")
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
