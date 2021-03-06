import { escape } from "../../../_common/html.ts";

import { cleanName, slugify } from "./mod.ts";

import type { Games } from "./mod.ts";

export const html = (
  { games, name }: { games: Games; name: string },
): string => {
  return `\
<!doctype html><meta charset="utf-8">

<title>${escape(name)}</title>

<link rel="icon" href="/stadian.png">
<link rel="apple-touch-icon" href="/pwa.png">
<meta property="og:title" content="${escape(name)}">
<meta property="og:image" content="/stadian.png">
<meta property="og:description" content="a lightning-fast launcher for Stadia">

<link rel="canonical" href="/">
<link rel="manifest" href="/manifest.json">
<meta name="referrer" content="no-referrer">

<link rel="preload" as="image" href="/squirrel.png">
<link rel="preload" as="image" href="/stadian.png">
<link rel="preload" as="image" href="/ghost.png">

<meta name="viewport" content="width=770">


<style>
  * {
    box-sizing: inherit;
    font: inherit;
    color: inherit;
    text-decoration: inherit;
    background: none;
    border: none;
    background-repeat: no-repeat;
    margin: 0;
    padding: 0;
    display: grid;
    text-shadow: inherit;
  }

  html {
    --viewport: 770px;
    --background-color: #202020;
    --body-color: #FFFFFF;
    --theme-color: #D72D30;
    --mascot-url: url(/stadian.png);
    --mascot-disabled-url: url(/ghost.png);
    --mascot-generic-url: url(/squirrel.png);
    --primary-font-size: 14px;
    --small-margin: 8px;
    --large-margin: calc(4.0 * var(--small-margin));
    --games-outer-margin: var(--large-margin);
    --controls-width: 720px;
    --search-height: 64px;
    --search-font-size: 32px;

    font-family: sans-serif;
    box-sizing: border-box;
    font-size: var(--primary-font-size);
    background-color: var(--background-color);
    color: var(--body-color);
    overflow-y: scroll;
    overflow-x: hidden;
    text-shadow: none;
  }

  @media (max-width: 770px) {
    html body {
      --games-outer-margin: 4px;
    }

    html body main st-games {
      gap: var(--large-margin);
    }
  }

  script, style, link, head, template {
    display: none;
  }

  form {
    display: contents;
  }

  code {
    display: contents;
    font-family: monospace;
  }

  button:enabled {
    cursor: pointer;
  }

  :disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  main {
    grid-template-columns:
      [columns-main-start]
      var(--small-margin)
      [game-columns-start]
      1fr
      [controls-columns-start]
      var(--controls-width)
      [controls-columns-end]
      1fr
      [game-columns-end]
      var(--small-margin)
      [columns-main-end]
    ;
    grid-template-rows:
      [rows-main-start]
      var(--large-margin)
      [controls-rows-start]
      var(--search-height)
      [controls-rows-end]
      var(--large-margin)
      [games-rows-start]
      minmax(392px, max-content)
      [games-rows-end footer-start]
      max-content
      [footer-end]
      var(--large-margin)
      [rows-main-end]
    ;
  }

    main st-search {
      z-index: 10;
      grid-column: controls-columns-start / controls-columns-end;
      grid-row: controls-rows-start / controls-rows-end;
      text-shadow: 0 0 2px black;

      grid-template-columns:
        [search-label-start]
        min-content
        [search-label-end]
        0
        [search-input-start]
        auto
        [search-input-end]
        var(--small-margin)
        [search-button-start]
        min-content
        [search-button-end]
        var(--small-margin)
        var(--search-height)
      ;
      grid-auto-rows: auto;

      font-size: var(--search-font-size);
      font-weight: bold;
      background-image: var(--mascot-generic-url);
      background-size: var(--search-height);
      background-position: right;
    }

      html[data-st-matches] main st-search {
        background-image: var(--mascot-generic-url);
      }

      html[data-st-matches="0"] main st-search {
        background-image: var(--mascot-disabled-url);
      }

      html[data-st-matches="1"] main st-search {
        background-image: var(--mascot-url);
      }

      main st-search span {
        display: block;
        grid-column: search-label-start / search-label-end;
        text-align: right;
        place-self: center right;
        color: var(--theme-color);
        user-select: none;
      }

        main st-search span code {
          display: inline;
          font-family: monospace;
        }

      main st-search input {
        grid-column: search-input-start / search-input-end;
        caret-color: var(--theme-color);
        outline: none;
      }

        main st-search input::placeholder {
          color: inherit;
        }

        main st-search input:placeholder-shown {
          color: #888;
        }

      main st-games {
        z-index: 5;
        grid-column: game-columns-start / game-columns-end;
        grid-row: games-rows-start / games-rows-end;
        grid-template-columns: repeat(auto-fill, 320px);
        grid-auto-rows: auto;
        gap: calc(0.5 * var(--large-margin)) calc(0.75 * var(--large-margin));
        margin: var(--games-outer-margin);
        justify-content: center;
      }

        st-game a[hidden] {
          display: none;
        }

        html[data-st-matches="1"] main st-games {
          grid-template-columns: calc(2 * 320px);
          justify-content: center;
        }

        html[data-st-matches="1"] main st-games st-game a {
          width: calc(2 * 320px);
          height: calc(2 * 180px);
        }

        main st-games st-game {
          display: contents;
        }

          main st-games st-game a {
            grid-template-rows: [game-rows-start] auto [game-rows-end];
            grid-template-columns: [game-columns-start] auto [game-columns-end];
            background-size: 100% 100%;
            width: 320px;
            height: 180px;
            position: relative;
            contain: strict;
            border-radius: 16px;
            background-color: black;
            position: relative;
            box-shadow: 0 0 2px 1px rgba(0, 0, 0, 0.5);
            outline: none;
          }
          main st-games st-game:not([delisted]) a:hover,
          main st-games st-game:not([delisted]) a:focus,
          main st-games st-game:not([delisted]) a:active {
            transform: scale(1.125);
            z-index: 100;
            box-shadow:
              0 0 0px 2px black,
              0 0 0px 4px var(--theme-color),
              0 0 0px 6px black,
              0 0 2px 7px rgba(0, 0, 0, 0.5);
          }

          html[data-st-matches="1"] main st-games st-game a st-slug,
          main st-games st-game a:hover st-slug,
          main st-games st-game a:focus st-slug,
          main st-games st-game a:active st-slug {
            visibility: visible;
          }

          main st-games st-game a:hover {
            z-index: 101;
          }

          html[data-st-matches="1"] main st-games st-game a {
            box-shadow:
              0 0 0px 2px black,
              0 0 0px 4px var(--theme-color),
              0 0 0px 6px black,
              0 0 2px 7px rgba(0, 0, 0, 0.5);
          }

          main st-games st-game st-badges {
            position: absolute;
            bottom: 8px;
            left: 8px;
            width: 100%;
            display: flex;
            gap: 8px;
          }

          main st-games st-game st-badge {
            z-index: 20;
            font-size: 16px;
            padding: 2px 6px;
            border-radius: 4px;
            box-shadow: 0 0 2px 1px rgba(0, 0, 0, 0.5);
          }

          main st-games st-game st-badge[pro] {
            background: var(--theme-color);
            border-bottom-left-radius: 12px;
            border-top-right-radius: 12px;
          }

          main st-games st-game st-badge[ubi] {
            background: #428ee1;
            border-bottom-left-radius: 12px;
            border-top-right-radius: 12px;
          }

          main st-games st-game st-cover-full,
          main st-games st-game st-cover-micro {
            grid-column: game-columns-start / game-columns-end;
            grid-row: game-rows-start / game-rows-end;
          }

          main st-games st-game st-cover-full img {
            z-index: 2;
            width: 100%;
          }

          main st-games st-game st-cover-micro {
            image-rendering: pixelated;
            background-size: 100% 100%;
            display: grid;
          }

          main st-games st-game st-slug {
            position: absolute;
            z-index: 3000;
            border-radius: 4px;
            padding: 4px;
            padding-left: 14px;
            text-indent: -10px;
            bottom: 8px;
            right: 8px;
            max-width: 250px;
            font-family: monospace;
            box-shadow: 0 0 2px 1px rgba(0, 0, 0, 0.5);
            color: white;
            background: var(--background-color);
            opacity: 0.875;
            border-bottom-right-radius: 12px;
            border-top-left-radius: 12px;
            visibility: hidden;
          }

          main st-games st-game st-cover-micro st-name {
            width: 100%;
            height: 100%;
            text-align: center;
            padding: 16px;
            justify-items: center;
            align-items: center;
            font-size: 36px;
            font-weight: bold;
            font-family: sans-serif;
          }

          main st-games st-game st-cover-micro:not([hidden]) st-name {
            text-shadow: 0 0 4px black, 0 0 8px black;
            color: #FFFFFF;
            backdrop-filter: blur(calc(180px/8));
          }

          main st-games st-game st-cover-micro[hidden] st-name {
            color: transparent;
            z-index: 1000;
          }

          main st-games st-game st-cover-micro[hidden] st-name::selection {
            color: default;
          }
</style>

<main>
  <st-search>
    <form method="get" action="/">
      <span>stadia<code>.</code>run<code>/</code></span>
      <input name="q" type="text" placeholder="your favourite Stadia game" autocomplete="off" autofocus>
    </form>
  </st-search>

  <st-games>
    ${
    games.map((
      {
        gameId,
        coverImageUrl,
        coverThumbnailData,
        name,
        slug,
        inStadiaPro,
        inUbisoftPlus,
      },
    ) =>
      `<st-game><a href="https://stadia.google.com/setup?redirect_to=https://stadia.google.com/player/${
        escape(gameId!)
      }">
        <st-cover-full>
          <img crossorigin src="${escape(coverImageUrl!)}=w640-h360-rw">
        </st-cover-full>
        <st-cover-micro data="${escape(coverThumbnailData)}">
          <st-name>${escape(name)}</st-name>
        </st-cover-micro>
        <st-slug>/${escape(slug)}</st-slug>
        <st-badges>${inStadiaPro ? `<st-badge pro>PRO</st-badge>` : ""}${
        inUbisoftPlus ? `<st-badge ubi>U+</st-badge>` : ""
      }</st-badges>
      </a></st-game>`
    ).join("\n")
  }
  </st-games>
</main>

<script type="module">
Promise.resolve().then(async () => {
  if (typeof window === "undefined") {
    return;
  }

  let desktopPWA = false;

  try {
    desktopPWA =
      navigator.userAgentData &&
      navigator.userAgentData.mobile === false && (
        window.navigator.standalone ||
        window.matchMedia('(display-mode: standalone)').matches
      );
  } catch (error) {
    console.warn(error);
  }

  if (desktopPWA) {
    document.querySelector('base').target = '_blank';
  }

  searchInput.addEventListener("input", event => onInput(event));
  searchForm.addEventListener("submit", event => onSubmit(event));
  window.addEventListener("popstate", checkUrl);

  checkUrl(true);

  await unpackMicroCovers();

  // Offline fallback (required for PWA installation).
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/service-worker.js', {scope: '/'});
  }
});

const searchForm =
  globalThis.document && document.querySelector("st-search form");
const searchInput = searchForm && searchForm.querySelector("input");
const gameTiles =
  globalThis.document && document.querySelector("st-games");

const skus = new Map();

const digits =
  "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";

const cleanName = (${cleanName.toString()});

const slugify = (${slugify.toString()});

const loadedImage = async (/** @type string */ url) => {
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.crossOrigin = "anonymous";
    image.src = url;
  });
  return image;
};

const unpackMicroCovers = async () => {
  for (const game of document.querySelectorAll("st-game")) {
    const full = game.querySelector("st-cover-full img");
    const micro = game.querySelector("st-cover-micro");

    if (full.complete) {
      // full image already in cache
      micro.hidden = true;
    } else {
      micro.classList.add("rendered");
      micro.style.backgroundImage = \`url(\${microImageToURL(
        micro.getAttribute("data"),
      )})\`;
      full.hidden = true;
      micro.hidden = false;
    }

    loadedImage(full.src).then(() => {
      full.hidden = false;
      micro.hidden = true;
    });
  }
};

const u6toRGB = u6 => {
  const red =
    (u6 & 0b000010 ? 0b10101010 : 0) + (u6 & 0b000001 ? 0b01010101 : 0);
  const green =
    (u6 & 0b001000 ? 0b10101010 : 0) + (u6 & 0b000100 ? 0b01010101 : 0);
  const blue =
    (u6 & 0b100000 ? 0b10101010 : 0) + (u6 & 0b010000 ? 0b01010101 : 0);
  return [red, green, blue];
};

const microImageToURL = microImage => {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 8;
  const g2d = canvas.getContext("2d");
  const pixels = g2d.getImageData(0, 0, canvas.width, canvas.height);

  const palette = new Map();
  for (let i = 0; i < 64; i++) {
    palette.set(i, u6toRGB(i));
  }

  const digitValues = new Map(
    Object.entries(digits).map(([index, char]) => [char, Number(index)]),
  );

  for (let i = 0; i < microImage.length && i < 64; i++) {
    const color = palette.get(digitValues.get(microImage[i]));
    pixels.data[i * 4] = color[0];
    pixels.data[i * 4 + 1] = color[1];
    pixels.data[i * 4 + 2] = color[2];
    pixels.data[i * 4 + 3] = 0xff;
  }

  g2d.putImageData(pixels, 0, 0);
  return canvas.toDataURL();
};

let filterElementsPending = null;
const filterElements = async () => {
  if (filterElementsPending) {
    return filterElementsPending;
  }

  return (filterElementsPending = new Promise(resolve => resolve()).then(() => {
    filterElementsPending = false;

    const query = searchInput.value.toLowerCase();
    const slugQuery = slugify(query);

    const looseMatches = [];
    const exactMatches = [];

    for (const child of gameTiles.querySelectorAll("st-game")) {
      child.firstElementChild.hidden = true;

      let name = child.querySelector("st-name").textContent.toLowerCase();
      let slug = child.querySelector("st-slug").textContent.replace(/\\/+/, '');

      if (query === slug) {
        exactMatches.push(child);
      } else if (query === name) {
        exactMatches.push(child);
      } else if (slugify(name).includes(slugQuery)) {
        looseMatches.push(child);
      } else if (slug.includes(slugQuery)) {
        looseMatches.push(child);
      }
    }

    const elements = (exactMatches.length > 0) ? exactMatches : looseMatches;

    for (const el of elements) {
      el.firstElementChild.hidden = false;
    }

    document.documentElement.setAttribute("data-st-matches", elements.length);

    return elements;
  }));
};

const onInput = () => filterElements();

const onSubmit = event => {
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  filterElements().then(elements => {
    const params = new URLSearchParams(location.search);

    if (elements.length === 1) {
      searchInput.value = elements[0].querySelector("st-slug").textContent;
      searchInput.select();
      elements[0].querySelector("a").click();
    }
  });
};

const checkUrl = (first = false) => {
  const slug =
    slugify(decodeURIComponent(document.location.pathname.slice(1))) || null;
  const query = new URLSearchParams(document.location.search).get("q") || null;

  if (query) {
    searchInput.value = query;
    onInput();
  } else if (slug) {
    searchInput.value = slug.replace(/-/g, " ");
    onSubmit({ first });
  }
};
</script>
`;
};

export default { html };
