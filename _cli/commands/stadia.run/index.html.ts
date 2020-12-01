import { escape } from "../../../_common/html.ts";

import type { Games } from "./mod.ts";

export const html = ({games, name}: {games: Games, name: string}): string => {
  return `\
<!doctype html><meta charset="utf-8">

<title>${escape(name)}</title>

<link rel="icon" href="/-/icon.png">
<meta property="og:title" content="${escape(name)}">
<meta property="og:image" content="/-/icon.png">
<link rel="apple-touch-icon" href="/-/pwa.png">
<meta property="og:description" content="a lightning-fast launcher for Stadia">

<meta name="viewport" content="width=770">
<link rel="manifest" href="/-/manifest.json">
<base>

<link rel="preload" as="image" href="/-/squirrel.png">
<link rel="preload" as="image" href="/-/stadian.png">
<link rel="preload" as="image" href="/-/ghost.png">

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
    --mascot-url: url(/-/stadian.png);
    --mascot-disabled-url: url(/-/ghost.png);
    --mascot-generic-url: url(/-/squirrel.png);
    --primary-font-size: 14px;
    --small-margin: 8px;
    --large-margin: calc(4.0 * var(--small-margin));
    --games-outer-margin: var(--large-margin);
    /* We allow tiles to flow to full width, but want to keep any controls
      or body text within a narrower window. */
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

  s {
    display: contents;
    text-decoration: line-through;
    text-decoration-color: rgba(128, 0, 0, 0.5);
    text-decoration-style: wavy;
    text-shadow:
      1px 0 2px rgba(0, 0, 0, 0.25),
      0 0 2px rgba(0, 0, 0, 0.25),
      0 0 3px rgba(0, 0, 0, 0.25),
      -1px 0 2px rgba(0, 0, 0, 0.25);
    color: rgba(0, 0, 0, 0.125);
    user-select: none;
    cursor: not-allowed;
  }

  *[hidden] {
    display: none;
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

        main st-search button {
          grid-column: search-button-start / search-button-end;
          align-items: center;
          padding-top: 8px;

          color: #444;
          cursor: not-allowed;
          pointer-events: none;
        }

        html[data-st-matches="1"] st-search button {
          color: var(--theme-color);
          pointer-events: default;
        }

        main st-search button kbd {
          font-size: calc(var(--search-font-size) / 2);
          display: inline;
          border: 2px solid currentColor;
          padding: 2px;
          border-radius: 4px;
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

        html[data-st-matches="1"] main st-games {
          grid-template-columns: repeat(auto-fill, calc(2 * 320px));
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

          main st-games st-game st-badge {
            z-index: 20;
            display: block;
            position: absolute;
            font-size: 16px;
            padding: 2px 6px;
            border-radius: 4px;
            box-shadow: 0 0 2px 1px rgba(0, 0, 0, 0.5);
          }

          main st-games st-game st-badge[popular] {
            background: rgba(64, 0, 0, 0.5);
            box-shadow: 0 0 2px 1px rgba(64, 0, 0, 0.25);
            border-radius: 32px;
            font-size: 32px;
            height: 36px;
            width: 36px;
            padding: 0;
            top: 8px;
            left: 8px;
          }

          main st-games st-game[delisted] a {
            filter: sepia(50%) saturate(50%) contrast(100%) brightness(50%);
            cursor: not-allowed;
          }

          main st-games st-game st-badge[delisted] {
            background: #222;
            color: #F88;
            left: 8px;
            top: 8px;
            border-top-left-radius: 12px;
            border-bottom-right-radius: 12px;
          }

          main st-games st-game st-badge[demo] {
            background: #112233;
            bottom: 8px;
            left: 8px;
            border-bottom-left-radius: 12px;
            border-top-right-radius: 12px;
          }

          main st-games st-game st-badge[pro] {
            background: var(--theme-color);
            bottom: 8px;
            left: 8px;
            border-bottom-left-radius: 12px;
            border-top-right-radius: 12px;
          }

          main st-games st-game st-badge[previously-pro] {
            color: #A66;
            background-color: #300000;
            font-size: 8px;
            text-align: right;
            bottom: 8px;
            left: 8px;
            border-bottom-left-radius: 12px;
            border-top-right-radius: 12px;
          }

          main st-games st-game st-badge[pre-order] {
            background: #FD0;
            color: black;
            bottom: 8px;
            left: 8px;
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
            display: none;
          }

          main st-games st-game st-cover-micro.rendered:not([hidden]) {
            display: grid;
          }

          main st-games st-game st-slug {
            display: span;
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
            backdrop-filter: blur(calc(180px/8));
            width: 100%;
            height: 100%;
            text-align: center;
            padding: 16px;
            justify-items: center;
            align-items: center;
            -webkit-text-stroke: 1px black;
            text-shadow: 0 0 2px black;
            font-size: 36px;
            font-weight: bold;
            color: #FFFFFF;
            font-family: sans-serif;
          }
</style>

<main>
  <st-search>
    <form method="get" action="/">
      <span>stadia<code>.</code>run<code>/</code></span>
      <input name="q" type="text" placeholder="your favourite Stadia game" autocomplete="off" autofocus>
      <button tabindex="-1"><kbd>⏎</kbd></button>
    </form>
    <div>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> last refreshed <a tabindex="-1" href="https://github.com/jeremyBanks/deno-stadia/actions/runs/392208595">November 29, 2020</a>
    </div>
  </st-search>

  <st-games><template>
    <st-game><a>
      <st-cover-full>
        <img crossorigin="anonymous">
      </st-cover-full>
      <st-cover-micro>
        <st-name></st-name>
      </st-cover-micro>
      <st-slug></st-slug>
    </a></st-game>
    </template>
    <st-game pro><a href="https://stadia.google.com/player/cf784a0f4c554ce68a2880cb461bd903rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/6HvkX4mV-LMUf7qL338sLn2Ss7NZeA2UD8iC2QYLBVY7Sz5U7yALebd2D6N9dlI8bg66VgtuLiRzzBvTAGEKn1sJe8K_jSf1lGmx3tQeeqKW-Dw1m1MN0l07iQ=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="KKKdddKKKLddzdKKKLeOeeKOLLPKKPKLQKKKKPLMQ0KPPQLQL-KPPLKLKKKKKKKK">
        <st-name>Hello Neighbor: Hide and Seek</st-name>
      </st-cover-micro>
      <st-slug>/hello-neighbor-hide-and-seek</st-slug>
    <st-badge title="Hello Neighbor: Hide and Seek is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/1376a179ca87458b85acd44341854772rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/vxoexA1rhd2GJrcPrZWeFJGMZT8GlF8GFl7zLCv6kCKmIh2NI3rb8SjF4B0NX2-_WSI1o1d98VcozI_lpskYF9vMxU4nLG9NjJbrfDxY8l27Od5NZ-1pa4uzXQ=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="zzeOK__KzjPPK_dOeeKKeeeLeP4KeeeKKK44OeOKPP4KKOKKee4KKPKKee0-KOPL">
        <st-name>Sniper Elite 4</st-name>
      </st-cover-micro>
      <st-slug>/sniper-elite-4</st-slug>
    <st-badge title="Sniper Elite 4 is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/cf65dc95d523465493d6fbc482452227rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/S5gxNJIiaF9Oab3dV-u4F8dj2sy6gY6umtugNKfRzWlCoUeOIslqBpDrZAXVSE6OPr3NJc0BVRuWICa5k-aK8MixvT6a4qg3jAMPNXHglRG-WSU-atH-juJznj8=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="FFFFFFFFFJFFFJJFFJKFJKKFJKKJJKKKJJKJJKJKFFJJKKKKJFFFKKKKFFFFFFJJ">
        <st-name>The Gardens Between</st-name>
      </st-cover-micro>
      <st-slug>/the-gardens-between</st-slug>
    <st-badge title="The Gardens Between is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/b67e43f2b05f4ba7acc56a4b222568aarcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/IZzT-SmnEmNDlOSmU-ctGffYh_wI7Or6Z8I4z4H3I9L2f5OOo0iseBZhnrBuMTp2ZIWnIo0T6kVL60lRUL7em__bapRBWJkjvOcqjehqhCvL_Y6hIAjGywu8Oak=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="-FJKKK---FKK-KK--JKK-LKFFJKKKLKJ-JKKKKKJ-KKKKKK--KK--KK--0L--K--">
        <st-name>Dead by Daylight</st-name>
      </st-cover-micro>
      <st-slug>/dead-by-daylight</st-slug>
    <st-badge title="Dead by Daylight is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/16d98de80a3340ffa4129953ae4e3206rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/Gw4F5Rql1NSmlx7v7HS0QjYiZlReSiiI-i2eHmyzi9xQtTk0W21NJb1LVG8hnsI1oi79OobGC2WnTX2SeHP8faP9luwONHpiRSoTeBkS_fGKGHGyhUaj2WHYo3I=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="d_ddttdetKdeeuuetKdedtetedKeudeuedKduuudOddeuuuOeeyueeuePduueeuP">
        <st-name>Human: Fall Flat</st-name>
      </st-cover-micro>
      <st-slug>/human-fall-flat</st-slug>
    <st-badge title="Human: Fall Flat is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/7b6d79b833354dcaa9b2461086a7763crcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/FZdjBJ1ygbaXNw74RNTLvwTB9cNsSRzPvlC_kzT7wFqda9GYCqkbubf-3TpH-lrt09yFrKz9Um5S8BTXP5u2KhIUkccdctWna18_RNjUEL7_KecjNB-4XsM8EUtE=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="zzyzzzzzzyyyzzzzzzyyyvzzzyeeeeuzyydeeeuzzdJezzzzz_Jezzzze_dezzzz">
        <st-name>Risk of Rain 2</st-name>
      </st-cover-micro>
      <st-slug>/risk-of-rain-2</st-slug>
    <st-badge title="Risk of Rain 2 is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/65864a95f9e74129845bda0467486413rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/w9BxPN6zb77lscIMjHKTGPchYdGvIG0hZcmByW3gGr-3nefc1sAhiVJtmHtPwMDoPTUNwqxiMEQltkLudRZMBU1XiMdtVu2Ya4oooZGWuBQ_8nJAVBUzOa9KEoY=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="--_Ke_----_eee-FGKKK_KKKGKF_aKKKG_F__KKKFK-KKKKK-G-KKKFK-FFKKKKK">
        <st-name>République</st-name>
      </st-cover-micro>
      <st-slug>/republique</st-slug>
    <st-badge title="République is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/2847419bbb5146ed877a308d9884f504rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/gxv80OCxjy_Xt_nAisCgH1gpC8-5UlfOu2Sbmp-r9qrwDoff31XfX0vvf6axEX4Txo_v2yTZoX0Ub_x2j_gu_tYOsG_6pVWUVYCm9sKlj0IsRQfm2pu56lPYb8Pj=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="aKPKaPLMeLeKeee1eLLLedLLeLLLeKLLPPaeeaLPPQ_KdeLPPeeededPededZe_e">
        <st-name>SUPER BOMBERMAN R ONLINE</st-name>
      </st-cover-micro>
      <st-slug>/super-bomberman-r-online</st-slug>
    <st-badge title="SUPER BOMBERMAN R ONLINE is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/9dc548a191914b419cc80802ca64788frcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/zfsydWTNY5gbUIVUu_dwfFHn9Vl_iSTJ9PgJD5HfcpWjZNZmwqbwZfuf_ztv99ZMfKVKoivyBHimi8CDcuHwyDC-g24cXQJ8nkwecKwhmxfs9mU0Z1w6ZQESxA=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="QPQQA6115KKQQQ5QPKPQQP5QQQQLLUQ5QQ5LLQQ5QQQLL5A5AAALL56556551555">
        <st-name>Hello Neighbor</st-name>
      </st-cover-micro>
      <st-slug>/hello-neighbor</st-slug>
    <st-badge title="Hello Neighbor is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/990ec302c2cd4ba7817cedcf633ab20frcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/K4cdZyCNR-LtN8LtkHCuvcoc3QC7LEFBY8y9OjJxGkYRtStskmqamLFS2kFG1tcDgtkHwMnKX2Oq5iGXoNdXiCfuJMqKuD_gE9ABbHIZUorFDOFOSRzNPbDQlg=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="GKK1HHH1GKG0GGG0F-GG000G--K-G00G-G-GGGKGFK--GGKGKa--GGHLaa-GGGLL">
        <st-name>HITMAN - World of Assassination</st-name>
      </st-cover-micro>
      <st-slug>/hitman</st-slug>
    <st-badge title="HITMAN - World of Assassination is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/16330bd770134d85b5bef3cc6b1407ffrcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/YLArj_wo5ZtpqIZmUqKEweGc21TJDPirzXMofM8-AMG1GPFWGKBsxIQGDsv3Uf_qUnkOgZdH274jfPNqX5DGp41LxoSp__YCj3BjN2RyZt-T3PeTxtDTKh7K_g=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="------F-FFFFFF0-FFFFGKLF-----0KF-----JFG-----JF0----FJFF-----J-4">
        <st-name>Gunsport</st-name>
      </st-cover-micro>
      <st-slug>/gunsport</st-slug>
    <st-badge title="Gunsport is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/382fe14629e148449e7b8f94e8aecb38rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/_qlVtqDeSrF3YVsP_oicwIUoWZR1w12EInvbS8U-1q4HHCm5QzGM7b_QF3M0Zd_VvPSVMQKIeQ_euRCudu6lDiOWkPIpBa-85aeYaONeRTPOgY5T7G3GVxVwgvQ=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="zzzzfzzzzzzeezzzzzzffzzzzfeeevzzzfLeefzzzfaeeezzzzfaeezzzzzLefzz">
        <st-name>SUPERHOT: MIND CONTROL DELETE</st-name>
      </st-cover-micro>
      <st-slug>/superhot-mcd</st-slug>
    <st-badge title="SUPERHOT: MIND CONTROL DELETE is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/d3d8e467203d401387857d5b6cc27263rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/UbwaBTbb-pXJXkYHP2n8J5SrZLjd5MfXst1d7e6KErPsiqzJfD9iazLQAokmJoKW03KpnfFOuthXsnGxg3I1WP5ZYS_d1Zf-xM_BvyQ9Rvrwp1koJ6MXWtTOPw=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="yuuzzeffeeeeeeeeKeKeeeeeKeLPeeeeePPLLPeePLPL5PPP54eLLP4454444445">
        <st-name>Rock of Ages 3: Make &amp; Break</st-name>
      </st-cover-micro>
      <st-slug>/rock-of-ages-3</st-slug>
    <st-badge title="Rock of Ages 3: Make &amp; Break is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/c911998e4f8d4c6ea6712c5ad33e4a54rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/7GTAoubUX43W_zaFkEvQoqAkruysGSkQygrV0DYkVzA7qsIcsboF4n1Kq0mejQIGdlSQxeh4-ZuNQWqMjJ55u0GCR3aBnY1MsMwrULT1-J73Rs3fc3bFO8YjT20=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="KKKKKKK3KKKPOKK-KLLeeKJ3KPeeedKJLKeeeeKKLKKKKKKKLLKKJJKKKKKKKKKK">
        <st-name>Celeste</st-name>
      </st-cover-micro>
      <st-slug>/celeste</st-slug>
    <st-badge title="Celeste is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/6d0d865669774338b3ce888a84da6cdercp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/5SLIiiPbwGuKqbjNqAsBSeBnBIT70gipNFcRB6pWUgNHfwnmG_njj98iJEX7Vn88Z8tKKhSEF21sE8Cy2ntOglHWHrgQk4wUbMgL-D1jz3Ieh1w-5lkhTdDfqaU=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="K333J---K3-4-KK-KK-K4KKK0K4KKK_dKKK4KK_dKPKK-KKdPPeL4KKKPeKKPKKO">
        <st-name>Lara Croft and the Temple of Osiris</st-name>
      </st-cover-micro>
      <st-slug>/lara-croft-and-the-temple-of-osiris</st-slug>
    <st-badge title="Lara Croft and the Temple of Osiris is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/c1928530515748da9f55afc7243fd3e1rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/2hTIWZCyMesKIpb-P8Iw5f3P6B7aoz9XaiQfXId7SQm3Yy_CS7OP67ZsOo1i7XJ_APv73F0YEbFfjP8L6tL0oWrkNL6pCxddsCq4tug0RMKYcP470KDV9x9tCg=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="-LaKG_t_FLLKG___FKLKK__KFKKK_KZFKKKK_KJFK5KFK_F--KFFFF---FFF-F--">
        <st-name>Orcs Must Die! 3</st-name>
      </st-cover-micro>
      <st-slug>/orcs-must-die-3</st-slug>
    <st-badge title="Orcs Must Die! 3 is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/05f66a46027747a08b930ea70374ac7frcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/zKMQv4UNHCJQ2WUJLCTzum9fjZpsWZXtHjdw4oXeTuvxXCyjAfU0bBwIllpMZqnuYOKg5ZphqxtWtjhPZFQAwpiIQiGOfgUA6YV1wkbENsaWjfhc0_UTMT5RNKLB=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="LvJZZJdaaa_tdZdaa_dttdd___deeddJ___ed_dKKLLL_K_K_eLLKKe_aeefeKz_">
        <st-name>Crayta</st-name>
      </st-cover-micro>
      <st-slug>/crayta</st-slug>
    <st-badge title="Crayta is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/ffda0b7e397243f8956f92f89b6902c4rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/uEhj9t8Jo2sPu2LT1BmnidFiwGUv5NDr44iZl2sfN9zbrxTwo3PxCn6JhpAKzc0XRaO3TnkeqC9aPF-1xQyIdcEkL9A5RLNqWNNlGt9nKjyIIWuVu1O-mSrzLw=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="efee_e_eeeeeKKeeeeeeLeeeeeeee_eeeeKeeeeeeeeeeee_Kezeje_KKedK__dd">
        <st-name>Panzer Dragoon: Remake</st-name>
      </st-cover-micro>
      <st-slug>/panzer-dragoon</st-slug>
    <st-badge title="Panzer Dragoon: Remake is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/3aed855f10b34f618e5f6c6f5467bcf9rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/i6ZIXQ9RKfAc_KpLAxNbLRzljAijoJttuGAqGwWaBaxdc2knx-v8x_i44bKMopt1PyqrMRkTLpIKSAz77v3A15BXUoSG0Uo2QOqGgouUFIHYNPtM_ti97M6omg=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="---00-----KPP-----KePK----KPPK----KPPK----4PP4-----000----------">
        <st-name>Little Nightmares</st-name>
      </st-cover-micro>
      <st-slug>/little-nightmares</st-slug>
    <st-badge title="Little Nightmares is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/f7afcff709e74227a5648aacadf03815rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/_Kq74m5MOfcbdQ4vS_z-ISsankMVUyUBnqjkqs8csS1xxogM72YjrUAJWnK_600aUt0LJyDVvI1RaVbZgAfdbfZ0nf8XlnF2mCPEd5Tqtw4UhDrgiUKHD7y5ckg=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="deeeeeeeeeeeuyeeeeueeueuuLeKeeeeyLe0LeeeyLe01ezezLKL0efzzL0e0ezz">
        <st-name>SUPERHOT</st-name>
      </st-cover-micro>
      <st-slug>/superhot</st-slug>
    <st-badge title="SUPERHOT is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/bbb1a143aa3449a5a1f236a05c305c9frcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/bYxWPLVUnAYpGDwNxjFyzq7UmAy_fxJh_MPEg2IGN9YtEgHs1aT-47B4SnoG_yYK-y4wY7UX6kMlcSkkimtQrnIJkVa_fLbnVhu2JqFAkxEioKjnzRtdyaZ2Mg=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="4KG11GK35PKM1KKKLPKL0KPK5K_K0KLKK5_LL_PKKLLLLLeKKKKLLKKK--KKKK-F">
        <st-name>Power Rangers: Battle for the Grid</st-name>
      </st-cover-micro>
      <st-slug>/power-rangers-battle-for-the-grid</st-slug>
    <st-badge title="Power Rangers: Battle for the Grid is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/c727a9083ce649e5b1cc6999c4fa2e5frcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/XTJGCrxzsGuyt5iUIZ4G3rcq9BeFtOq7svkInUNXnIRaVaSwRTKOOPscVPK-7XB8uT9YxG2RkZixfoucfL-_75dE8RVGaxRuvs18FIIbN71jlqwx30f7VuvyPA=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="yy_u__yyKydee_uuKueeedd_eueeede_uueeeddKzee_ddKezyddKdzzzzzeezzz">
        <st-name>Jotun</st-name>
      </st-cover-micro>
      <st-slug>/jotun</st-slug>
    <st-badge title="Jotun is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/5ec4424b963f44d18d0016322c19c9f0rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/k4qwu36Xxa-7po_Gl0LLHLlr0fKtjewYvMH07j3M4vpZ4YVFHe-ZrdMY-kKAYHgMPdIXGDrQrb04xl8QCr04E7LQT8Z2JJsDQvf1qwBn1XslM18RbfDLPb_Ojlk=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="---GG-----FaG-----Faa------WGF----0GK0----4440------------------">
        <st-name>Sundered</st-name>
      </st-cover-micro>
      <st-slug>/sundered</st-slug>
    <st-badge title="Sundered is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/d599576cddfc400f804b889460e84cb3rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/zYyNot2hmVTwqGaFhklb4bEw8MnTcY_jk95wL-Q5Iok3X76054BIeCUkqBR_k0W9KhottmCJo5wBDovOEFebvd9UCKN9XNnaUt_DC1mhUXkIqxRnPJ2Me5PL_RY=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="0G0KKKK0KKLLLKPGLeLLLKPKKLLLQLL0KLLKQMMKKLLLMLLKK5LQQPQKKLQUMQLK">
        <st-name>Embr</st-name>
      </st-cover-micro>
      <st-slug>/embr</st-slug>
    <st-badge title="Embr is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/a4c5eb3f4e614b7fadbba64cba68f849rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/gQ3RHB_zqRa15XH9bZ1IuxAlAHudLM_892yMrWJKs4OUNxB0iysdqEXHBCLOG5ZkenmWi8r0JwcNFOgqlyMtu1dXUGUJRtIVRofr8gWBUgek-got3gGkHfImmVA=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="___ueed_ddd_zzd_eyddeud_KeuuueeKKLQeefPKK46LLM5K40440000---0K0--">
        <st-name>PLAYERUNKNOWN'S BATTLEGROUNDS</st-name>
      </st-cover-micro>
      <st-slug>/pubg</st-slug>
    <st-badge title="PLAYERUNKNOWN'S BATTLEGROUNDS is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/c4898519ff254b969ede8bafdff927e8rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/EDJXmZlwYp3nr2gjMYhSKPw8vsxpTkxi-VlUMAI0NrrQWp01mOeuLnRbQYunW_34-E0tQpFF3ANnIZf0dMh2ca2YbUjgvI0pMjWDJfexaow-HlB4PqiOcYf7o9Z7=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="---------4LPLL4---4550K-J4954-L-K4945-K0-K444-50--40444---------">
        <st-name>SteamWorld Dig</st-name>
      </st-cover-micro>
      <st-slug>/steamworld-dig</st-slug>
    <st-badge title="SteamWorld Dig is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/819cdf4b7ff94947941106571ccf41e5rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/BmKVT4vYHvmpJBWzzQ_aks7pgL8bzk-ZFT242a9h6t41mQiOyJl91aY3zKa0oPEnQsmdb1RgfTv1UdhB7IUlpZdIkuaB9e_QY_dk1o6ENkr-_uVAn4-x05hdwA=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="---KL00---0KLLG---KKKLG---KKKKG--FLLKL0--GK94G--FKG4G0-----G0---">
        <st-name>SteamWorld Heist</st-name>
      </st-cover-micro>
      <st-slug>/steamworld-heist</st-slug>
    <st-badge title="SteamWorld Heist is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/b832835182124d4d83cb76a74a76a33frcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/7GuaGW36-UMWoS3B0fDQ9V3wTUFpYAx22adiUN162c7SR3JfX8EQn2czFuMWXVxk8QxK7IjNJHfaA80FGayemuVshQL0r1ogpaG0NSYhyYzvM5uYuF_K8X1Puhk=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="--00-----015-----055KK_J-05545KF-0L445K--JPL00K--3K---J--3------">
        <st-name>SteamWorld Dig 2</st-name>
      </st-cover-micro>
      <st-slug>/steamworld-dig-2</st-slug>
    <st-badge title="SteamWorld Dig 2 is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/b845605f8eb447008f3f0d2295265ffdrcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/D-p90wJ-1PtYala--zX5dMmaFIHTZiwYudGB-AcVharTzcf9G2TO7zhC625TB4a1U09tl1X7ql4KzMEhr24KvD49PitMLxI9MP7C30LnIegr1XqLfhTnpg-Clfg=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="-4-0K---4KK4KKKKKKKLKKLKKKKLPLPKKK0KPLPK-G4KKKKK0-0KK400--4-4444">
        <st-name>SteamWorld Quest: Hand of Gilgamech</st-name>
      </st-cover-micro>
      <st-slug>/steamworld-quest-hand-of-gilgamech</st-slug>
    <st-badge title="SteamWorld Quest: Hand of Gilgamech is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/20e792017ab34ad89b70dc17a5c72d68rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/Hnrphe5otP0vnVnSEN5-FHlaOZK34rD9ak2s76hfWo6MOkVBtWpFbhosuOsoilp_fctd77-knejqANKGYPv8vqlOnBg1iypk7vZn6OFp9kSkXW7Wz1R4lGirbnIv=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="KKKKK4--3KKKK4---4KKPK---KKKPK4--4KKPK4---4KK4-----44-----------">
        <st-name>Destiny 2</st-name>
      </st-cover-micro>
      <st-slug>/destiny-2</st-slug>
    <st-badge title="Destiny 2 is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game pro><a href="https://stadia.google.com/player/18a3cc2bb111419c8ac873086d04dfaarcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/Kn2LsxzVn65aWLTjJwB_kXDzGusf_bhLijJ-1T47G-6AC2a4bxRsD-IvgmOKv5QeKIbKOTA9PC9209LoLthGjhykbxIJNxLWruyeeBZvMXLANLarBQb5ByC7SwM=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="FKJKKKKKFKKKKde_FKKKKKeKKKKKKKeK0G-0KKKJ0FFFKK-F0FKJKK--JKKJJF--">
        <st-name>GYLT</st-name>
      </st-cover-micro>
      <st-slug>/gylt</st-slug>
    <st-badge title="GYLT is currently included with Stadia Pro." pro>PRO</st-badge></a></st-game>
    <st-game><a href="https://stadia.google.com/player/016636d5f49f4862be3ff8cbcf6c7adercp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/91ygATFjUOpjk28nV7j0Byz__VS48GOvhk7wPReAfwI7xkXvM-Xz3hleIBvtPSqht3WNvWZmuFz3KPhtZpHMi6uJA40I54cShOaKHIo8vOmXWYLNqVnP0oxduQ0=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="JK___t_uKK_Kuu_uKaKPed_uaa_KKd_uKLPKKdeuKKKKeuueLeeKezuaLeeJKPeK">
        <st-name>Ary and the Secret of Seasons</st-name>
      </st-cover-micro>
      <st-slug>/ary-and-the-secret-of-seasons</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/e4e8f5e5bc744270a644c554ba3f2962rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/hhoSFLhTo510uXUxZzGhcH6g3xS07p29RhfuyvzL988CYLfCRRDYpKLOQnCVHIHI61sWwFdfVPuN6TCDVu0SkRo9rpN4dZisCrD-9LPIzCsVzOpTqGA_g_i2zEA=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="eeeeeeKdeeKKPKKKdeeeeeKKdKdKKe4dKKKKLK4KeGKaKKKLedKKKOeLueade4L5">
        <st-name>Little Big Workshop</st-name>
      </st-cover-micro>
      <st-slug>/little-big-workshop</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/7d9beb13648d44839b9aeea7555c37c0rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/W3YAbgkGY4t8G5xswCMQEaQwiDSSB9wXVlmB64LW6ctiRHoFQgX2ojnQ_Rv1GPXAJE3vvFCvH9sKktnrDSkJ0u-4iHXkf7B8DTd56qvm48Cj_mO-lBkax5jQvyNy=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="eddee___edeuueedKKKeeeKKKKKKKLLKKKKKKKKKKKKKKKK404KFK44K---0-0-K">
        <st-name>Far Cry 5</st-name>
      </st-cover-micro>
      <st-slug>/far-cry-5</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/a2a4ff75e249404a975db7ae5f77e536rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/5XdyapmRHJ5WPIJrufDOtClKRCYnHM5YIkTte0Mj6bu_neKxGqFBZW4AmRdsTQD-ytWhyiRNY7a4kmzJLy9vnjXn2cSOgTGcCQ4fLotakxR6oDfaaWrkuXmqmcGb=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="yyyzzuytyzzzzeyyPeeyeeeeLPeeeKeKLLLPKKPKKeLKKKKKKPKKKKLPPLK-4KLL">
        <st-name>Far Cry New Dawn</st-name>
      </st-cover-micro>
      <st-slug>/far-cry-new-dawn</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/cc3f233990754f77a5819a583594f399rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/103sXFNBrXFaocFt7sYc-bediqAti67aqmd8tRv9FxJW2VT8r1Vy2Ippr2Ww2o677u4qC6RP2_lJMPP3LNyw39xCYK7vqzOvU6dMUCz9kq-7Sa7WRogkzvGvABQ=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="-----K_K-----_KK----KKKK--K-KKKK----K4KK------K-------KK----F-KK">
        <st-name>Sekiro : Shadows Die Twice</st-name>
      </st-cover-micro>
      <st-slug>/sekiro-shadows-die-twice</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/19efd5fa36794d7b8bc87de68124e705rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/5tM4vcmtXQsvyILbsXBpzKLtwZX9Fh4YnWMF_YM0htV-S_PNqJd62kQ4F1EHr-xrfvzMhk1AJoOffvn4fVzvuCId6n4ORh5XuW2BjmysVOMGgDGyNgdBX6IAb3o=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="eLLaeeeKjffezeeezffeeLKejQfPfLPezffPejLfffQeffQfQfPLPPfQQQQQQQQQ">
        <st-name>Cake Bash</st-name>
      </st-cover-micro>
      <st-slug>/cake-bash</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/41de509cbdbb4a13828636099c57731arcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/wYhbd-RNKkmp2R6HClNKH-lW8A3iEAL97lvZ0ScM7KWSFhYG94bBJuHnI6N3SVN9w-JDjCZlErGaIB8HlxLP5-3lga5-j78lEjtOlGWwD_Z2bokkV7ZFNCIcXxmG=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="FFKKGFFFKKKKKKLKKKKKKKKKKG0_KKK0KK4KKKK-FF0K4K----0400-------0--">
        <st-name>Baldur's Gate 3</st-name>
      </st-cover-micro>
      <st-slug>/bg3</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/b3bd32ef05444a189dcdc88f8e85d7f2rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/5cDvuUQf2UGfQ4BX31cWr7Zd1JrdopRbMPGKlT9kY8O2aq2n0_-xQJBN3FF33CDq2Vlm7EShy1S86QaDsO-8UuhYBsZDF2wLlKxfCXuyaGdMCDJyGR68AQrqgrE=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="KLLLLLLKLLPLLPKKPPPLKPPPLLLPLLLPLLLPPL5KLLLLPP5LL5MPPPLL44L54444">
        <st-name>Serious Sam 4</st-name>
      </st-cover-micro>
      <st-slug>/serious-sam-4</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/5f54e869de4441f8998e80d2c54fa74brcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/UHWCaasl8h-oq-DfmJxN1IghKfii4CaqVYcQ6Xk7mKLzxSTjlnaIUMEw-o1WGpHL66sSC_QW8FlL4-WbQDLCbGwWcSuafVcTvtGmUODXpXkST8LPs43R-hXBv_ia=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="--FePGGF--GKLG0---KLLK000FG0000G0GHGHHGK3GLLaLG03-0dKK-333---G--">
        <st-name>Hotline Miami</st-name>
      </st-cover-micro>
      <st-slug>/hotline-miami</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/68add0d67fe3491f94cb439664b1ffc7rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/AErmZ5XaVGSBvutxVrGzuiTQ3A40HS2Xxu5ALCouor0amFt8IJxnB3U9wnibceKslS15NA1dZgkycLG5Ygl6K25-w2o6TvNYbQtF6Ee2hE2tBewZq_dZvuCacA=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="LL0LL4LMLLKKKKMMMK0LK0MMM405K0L6M510005MM54KKO56MAOOOK5A49KLLKA5">
        <st-name>Hotline Miami 2:Wrong Number</st-name>
      </st-cover-micro>
      <st-slug>/hotline-miami-2</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/f28e66bbd0984c77ac6a54e8cc3007bdrcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/3QgaW3YZFtsdFYcDTQ5AnqlidwtwqFnUse4vNm2Ax9T5CsEwJnn0H3lDXDnYoMZoEXOgRGGjnHPdW16LwwfOSMnyvo8HfgPeVueaHmd5zfaPQBbXCYqywxCOvQ=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="e_ee_eKKeeLeeeKKKeeLMLKK0K_LKLKKKK_KKLKPKddKeLKK_ed_Led0eedKKeeK">
        <st-name>WWE 2K Battlegrounds</st-name>
      </st-cover-micro>
      <st-slug>/wwe-2k-battlegrounds</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/1694aaa3968344228424092f180a3e0ercp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/0Za-v137JTw6smGBkI7fpfnnsp6GbqczSuaimtqcNqnHbpsZl1s6B361V77RqNBbO4DEIdsqsAR-eH4T7-9hgv0wBD2CnkgMLV1uOp13Qd27eoaIj5WobmzY-g=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="015QP6P10LLPKA610LLLPQ6105LPPAA5056L6QA505M6AQA10166AA6101666661">
        <st-name>UNO</st-name>
      </st-cover-micro>
      <st-slug>/uno</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/b0a2ab7cdc194582bc4d111c07c2e30drcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/g_7_U-gilbzsYUOVWGHHpQ5b7x7Yoq6jbzUP7TeKMQpplREGTLFi0_Ut1vbYKDDGVpAtsOrh6tB7QG8ykKY2oZzjr2jTb4Xl_S-npZze5qGbcXuuJuXHWbv4w2lF=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="zzzzzzezzzzzLfezfefffeezeeefzfLzzzzzzeezzzzzzzfzzzzzzfzzzzzzfzez">
        <st-name>NBA 2K21</st-name>
      </st-cover-micro>
      <st-slug>/nba-2k21</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/232ff8abc7f74421a477e9e09dbf487drcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/0KlgWVPnHyagmO0SXncfu2o12AGTgMc-2x8qMXGTjaHxIQJsyoUh-0kk45XYMDDPAqR5oDwKWvEIoFYaamZsL0xc6M2MKVCF6dXgVxEf1QwC_SrTTP-euJU2EA=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="eeeeeeeeeeKeeKeeePKKKKPeeKKKLKKdeKd_eeKKe_KKKK0K_K-F-FKKKK-FKKKF">
        <st-name>Marvel's Avengers</st-name>
      </st-cover-micro>
      <st-slug>/marvels-avengers</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/657210fe20ad402b85bda8f816b80d98rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/T6-KIeQp8qhzOhSSek1OfaixGDaWZZydyBfevhwHK6TQXgTb_EZJnUm9NfkW1D0DywTnJTk5FRybJZz_NPaXCOjRBOoiQhTfOUjzRA0gyYWiOjZuolJSfSyhUD8=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="5yzuufff1uueffee1LeeeeeeLKa_ddtdKKKK_eduK_eJdded__dZdddZ_ZddZZJJ">
        <st-name>Windbound</st-name>
      </st-cover-micro>
      <st-slug>/windbound</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/6a2ac2fc8e684c41b5c14981dcb454fdrcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/o7WuFGGryhCQ68Qtd8AHjiVxUu6-TNLLH__6U_A3z84qN9yNb5G_Yxg8_vGaemzayPfX348LuZSE5UozPw8y059sA2scZQlpnVroBH0TI3KEtwJUY1Ni9O-6ZQ=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="zyyyyeyyzyyyeKyzzzyeeKezzyeePdezuPeLLeezK4KKe_KK3-4KdKPK334KKKKK">
        <st-name>PGA TOUR 2K21</st-name>
      </st-cover-micro>
      <st-slug>/pga-tour-2k21</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/430bbe284fb7482c9afe8e877b119269rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/w1hu6fEugUo3K748HUPNIoRuiY9sEzqNUqqpq0MmSPo3Wfs7G1XGVhJuwpKNQAnqerG1ZBqXp7aV08XkDCt5xxT7PKb6U6tIVX6eyaVjAckVWtOcusrZZVhMPfc=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="uuuuuuuyuueueyyyuueeezzyuyeeeuzyuyzzzzzyeezzezzdedeeee_JJJJ_dJJJ">
        <st-name>Spiritfarer</st-name>
      </st-cover-micro>
      <st-slug>/spiritfarer</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/cc1a8e0e94d54f15a22149fed93bbd7arcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/Oiriurt7C92GiV2J5jXi2WuRouqvFXCSrRvZevSJfbSiSAhjfSw2C-pVjLOK_xi8d0sTkNFGVM-hItmkW7_CtJM3xno1EBjJcmDmuIBRTy3IyEFCJKDHP5Gx1w=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="111zf011115LL1115511111111551100115551-0050QQ0000015500010001000">
        <st-name>DOOM</st-name>
      </st-cover-micro>
      <st-slug>/doom</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/ed05d9df2ec4452594b07336e360a1aarcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/N0zOQ_NWBD7V3Jk8KnEwsx6DaFmqoTx7DwTsRimPz1680tcFFavq6jctSBOQCfRhmEfQDGDjc2oH4SywCz5b_HWImcwQ45b_tlYHHSvVaRryez255PxiNNmAIA=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="de__d_ddKddeeeddK_e_d_eKKdeeddeKKK_d_euaKK___KuaGdK_dKea_KG_KKKa">
        <st-name>Relicta</st-name>
      </st-cover-micro>
      <st-slug>/relicta</st-slug>
    </a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/f5f9708a422a44cc876c240cfa07221drcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/BaL9NOmKI5VsUsbtruoFaLd7v8Pn-mK21e78dGZ7wNJ2SxJzM9wjP4cSAOpN798Ilcd3TrACEyxnRYpKz5xdWzxpk72mQ2gkLdh_HE8NxwXkJvklIelcezhoOdv9=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="zzzzze-dzzzzzz-defeejz-dj94PPz-djQP49eFezjjeLe-ezzzzz_Kzzzzzzzzz">
        <st-name>Kona</st-name>
      </st-cover-micro>
      <st-slug>/kona</st-slug>
    <st-badge title="Kona was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/8e77c7a4368944589b4c9d8179d2eb4crcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/3O4TSLomARrLlHKKXT_GwyFZ3NjqF3XO1B36OkjJbR3Xm_qG2F3QaHwqAIT6RqTBWWVgDoMHeItCQZm-7EWXqe3namAwYpcN67E8DmLac-pu-_bVUYTR9P8lfcw=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="-------------KK-4KKK-Kd-KPeKKJd-KeeKKKe--KKKKKKK---K--KK--------">
        <st-name>Strange Brigade</st-name>
      </st-cover-micro>
      <st-slug>/strange-brigade</st-slug>
    <st-badge title="Strange Brigade was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game><a href="https://stadia.google.com/player/76309b9f2f294b07b410e8b6aa879273rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/i2Pknci-zs4_WSF0FBOcieerCBWWBqmPseOMGlEfO2K8OTyWG_4EmZDuRoMLNdQ9Sgp5xUiUSBaE7SvGCMTBim8jIpFuJTMQBIKGsKXfNovN9qYuiYyUFm-oTw=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="avvvfvvu_vvvfvuf_uvvjvue_uvvzvuaKevfaueLKazzaeeLK_ezaffLFKKjafFF">
        <st-name>One Hand Clapping</st-name>
      </st-cover-micro>
      <st-slug>/one-hand-clapping</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/f3519f3dc3d74fbb8086520577b832e0rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/2VmjVZJMgt8NidcP1SsngJcDDN3if2Kz82-MjOgDWnNLYRithBzEaD_7NIiWE5-NwgtnL3uhFlRp5y796vLVd3ZDIZcDUh0zq78-vz1lKBykYSuHuA_f3GwhkQ=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="1111111111LLLL1111LPLL1111eeeK5110eeLK1110KeKG1110KKe-6110KKe-11">
        <st-name>F1 2020</st-name>
      </st-cover-micro>
      <st-slug>/f1-2020</st-slug>
    </a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/ef14fb2f692c4b42b4b092d3e7864cd8rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/_iHMt71ESCfE4EKF3IhCCXCQTLmpn-zl7C8XyGl7fADYYF3W9w8Til_OLqeNGzsppZvZfEFIIQIx4Ec1YMPSG1bE2TB4_dY6gAU-l62Wijx1XCC18j1IWiplUNE=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="tdddstuzdddeuyezsdsdteezteddeePzeeefePQzueeLePQzueMLaLfzzbILLHLz">
        <st-name>Monster Boy and the Cursed Kingdom</st-name>
      </st-cover-micro>
      <st-slug>/monster-boy</st-slug>
    <st-badge title="Monster Boy and the Cursed Kingdom was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/0a60fff637b445a797623d0c69433a9crcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/jSXfWyncAmtfJQhxvaJ5-foSXBoyA9DB4h3c_npdP7UWP5pzUwHtHQ_t8xc51FOddChtCu9UShV_wpQBQBMQvrMFm71ABFBfATfuoBcrWkqRChYy0Izxij-zoFqc=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="zzzzzzzzeeeeeeeezezzeeezzzzzzzzzeeeeeeeezezzzeezzzzzzzzzzzzzzzzz">
        <st-name>West of Loathing</st-name>
      </st-cover-micro>
      <st-slug>/west-of-loathing</st-slug>
    <st-badge title="West of Loathing was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/6b43cecd79734ba28cef5894985c65f1rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/4PB-AwkBss_SSWOTl7jVq_oxCK_pgOjZp86koLjoX-Sm4ABdgFOrR_-EKJeI_g0EFBHZZPGeJ64yJdI_8sUTQ1eLt6EslTeQ8R9g8Y9SvhnPD_ElF5IaritDpg=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="-----------00---------0--00KG-G--GJKKKG--GKddKH--GJJJJ----------">
        <st-name>Just Shapes &amp; Beats</st-name>
      </st-cover-micro>
      <st-slug>/just-shapes-and-beats</st-slug>
    <st-badge title="Just Shapes &amp; Beats was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/9b3ea6519cac48d68ca821f07b1a6a3drcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/pNkat8_246cNcryrkWCYOeeyKH3CwOyhOc1yCn7gOWwD9cDzgGvbWvgxAiXTNjqJHVpZU7Dkkfamv03utncHipcQwvrAYRtPhvgf2vUZJSL4IxAeJ-yjOvF1hZbK=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="dezKzzeedeeKLeeKKeeKeeKKKe_KeeKJKeKLLdF-K_K00K--KKK--K--KK---F-F">
        <st-name>Metro 2033 Redux</st-name>
      </st-cover-micro>
      <st-slug>/metro-2033</st-slug>
    <st-badge title="Metro 2033 Redux was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/b65c1c4dcdf24446bcecda190c6a2fe7rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/LXYqwgAVSfrtwMdb04QwU_jZ1H1etEdIoMbrFyBYdg3ZVXOSjAWuk-1pzGGhYcKaUeCxZbOGJiEFqBnV1AU5utIyqhouCoKLzZ9cQVyNEFKWNPGra9Nvah3VLg=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="efzeeeeKKfzeKLKKKefeK-KKKLeee-K-KKKPP-K-KKK44-K-KK4--KK--4------">
        <st-name>Metro Last Light Redux</st-name>
      </st-cover-micro>
      <st-slug>/metro-last-light</st-slug>
    <st-badge title="Metro Last Light Redux was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game><a href="https://stadia.google.com/player/3e7b24085e704c10ab03f93a19947c14rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/HiQcR4gmywD75x19Jf0feyw_hn8t0XDxHOAuc5x0GBbQ7BdW5IA7L62x34b9l_ZgyzyPEXTF6Dx12212dAT8asYhpv-nuoo-uiK9_l8URjpnn2ZlkxN59KLFZP8=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="GGGGWWWWGGKGeGGWFF_aL_GGGGGePaGGGGKaeLGGGGKeeaWXWGWXXWXmFGWGWXGG">
        <st-name>Wave Break</st-name>
      </st-cover-micro>
      <st-slug>/wave-break</st-slug>
    </a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/b17f16d4a4f94c0a85e07f54dbdedbb6rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/VCKnxbXMb5MMzUB421oybiNC_Tx7gV2fF0Bp24nOCiqxTBSeQ5uby8gZzNurpch_LI9WTgGTpBJ8YbjEcQMp-9vH4olGrLZ4ZGOOy4kbxiVTZADd8vuhMtgak4M=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="KejzjePKKPePKePKKKeKKPKKKKLK4KK-4KK40KK--4K0-K4---44-K----------">
        <st-name>The Elder Scrolls Online: Tamriel Unlimited</st-name>
      </st-cover-micro>
      <st-slug>/eso</st-slug>
    <st-badge title="The Elder Scrolls Online: Tamriel Unlimited was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game><a href="https://stadia.google.com/player/5a0e892c933c4f56b4d87976cb655ecfrcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/2f9y7BvYG9RnFuEMBmCXbRbwdbG8g9AVQbMNx4m8M3bdIcIjVNz8MsY3jm6KTwGqsPa2XtHQ-y2gn0Yrtqf1UMwuYf1I2OeMHlHxQLlgdfkUzHr8xsjh7DWcpSg=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="------------------KKKK----LLLL----554L---059550--004440-0000000-">
        <st-name>DOOM 64</st-name>
      </st-cover-micro>
      <st-slug>/doom-64</st-slug>
    </a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/cfd2977e1b9f412387ca2f44848400acrcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/wnZysSWLXqkoH1jxmsyMM7ZdBnj_RhHf7Oix6pbsc-5LiT-VLgkZMpH2mXWuVh9YT9JooKkJmmKfJ5vXbsrvVPUKdVnphRwFj-7niRw7IYXC9G9zAm0oNy3vOjs=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="-KKKe-Ke-KKKKKFe-KKeeKKd-KKeeaKe-KKeee_z-KKeKKez-KKdeKez-KKKeeez">
        <st-name>The Turing Test</st-name>
      </st-cover-micro>
      <st-slug>/the-turing-test</st-slug>
    <st-badge title="The Turing Test was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/cba537cccfe3470b8784f88660ea5f09rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/Xow9LHMuoDKY5BcniXJml8QB1yhxfG-cQnQewiayulyVYPdTxmEkalH0EPgdGAOFrNGJHdAKW6LxjzGv61SFGLn3t-lSaqBQ2-g53O0GeaibMrkx7xUvZvNcrQ=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="------F-----FKK--00-JJKJ011KJKKJ-0KKZ_KJ-FKK_KJJ---KJ--J----F--F">
        <st-name>Zombie Army 4: Dead War</st-name>
      </st-cover-micro>
      <st-slug>/zombie-army-4</st-slug>
    <st-badge title="Zombie Army 4: Dead War was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game><a href="https://stadia.google.com/player/48ead86182b14fe0afcc5f2927dbed51rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/Y5bhR3kzAE7olMePHIUoiHk6fs7gIvpqZyL5U-IKBMhRQbL7JQHVivWS7SavfywrA4bG2sd3crQ48orttlRYA8rneM1C0lqo-sDeQmtNGzVCoM2lOiIGLyufKSc=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="KLKPPPPPeePLePeePPeLPeeeKPeKKKePLPPKKKPLLLeKKKKPKKKKKKKKKKK-K-KK">
        <st-name>OCTOPATH TRAVELER</st-name>
      </st-cover-micro>
      <st-slug>/octopath-traveler</st-slug>
    </a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/73182869b2a644bdbef46984b96e1721rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/cEVs9JfH54_iiVjACC63MvIokK6JXMdaNGJ5YIeqKIg3c8sYHpsLm8wCy9GmlEwi_JYyCSw0Zfgsucv47CwZqPZ-Z5kDoIZvZDnoj7PvIafyTIpXvMZ6HBEwRyXA=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="tuudsttsPteLeuydOedLPyeOPeeLPeeOPeeLKeLKeeeKKeKeeKeeKeKKKKLLKKKK">
        <st-name>Get Packed</st-name>
      </st-cover-micro>
      <st-slug>/get-packed</st-slug>
    <st-badge title="Get Packed was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game><a href="https://stadia.google.com/player/10b8a9cc8ec746f29afc1fc3c3ded28brcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/Al3QfOz25vWgOUrxSQU0-xl8bn3ti2NpBq0fAoOP7-79omCOQIT9fo90QIeMtp7q5SlcKjFEQxSbWZFC732WsgDrBh1nDdQULf-K4vdSH6N3A4Dt4zz8r7gQg-xV=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="uueuuu_-euefffZFLPeeef_JLPLeLe_JeeLeeed_eePKKeeeeeeOPeu_PedPKdeJ">
        <st-name>Monopoly</st-name>
      </st-cover-micro>
      <st-slug>/monopoly</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/e465c4086aff4884990933d9f119f5f5rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/cOLw5MXyvc1nyle-7Cdu0DB3bkOKtsj3OjxSLlf8XigEu6NlB6vj8ewh4zlg6H_1NOocXfP3_kO3dj7nimCSnB5gowkorfQd0kpJA74dgUsTYMtLWmyqhjTBh4s=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="----44KJ----K4KKKKK-K4KK----4GKL-----KKK-----KK0-----4K---------">
        <st-name>MotoGP 20</st-name>
      </st-cover-micro>
      <st-slug>/motogp-20</st-slug>
    </a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/15a067411b8d4429b0954434d8f05d48rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/De6syL9EA97s1Exz56Jg_3YxLOy06Il2I6hg0Yk8MqummuD70ufL69NS7PiQt4WqueXpdhUXhDewEXmqV667tpbcnoADUgOOp_Zzp89OoG8kWuOmy-ZZJYZT2__2=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="deeaeueFePeLL_KFaKKPPPKKLLPPLPKKaa__KaKKQedPKKKLALdPFJKL6_PPKKPe">
        <st-name>Stacks On Stacks (On Stacks)</st-name>
      </st-cover-micro>
      <st-slug>/stacks-on-stacks-on-stacks</st-slug>
    <st-badge title="Stacks On Stacks (On Stacks) was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game><a href="https://stadia.google.com/player/d334bea27ee64ef5a3a9bb14b1d6a88ercp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/1lhuwC0b8Lycp3LZ80XPcWN_rZHEIIqQl4Uv8MRr4CFO52DFFCn1cCJHSni2cLXgpyQAlOqAHkcQBj7XQXrjOr1IKaHmffXU5sg2F0DAjkOt5WD83mw3R-bYGTTh=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="JJcdKdKK-JdOedKJ-KKeeeKJ-KKedKJ--KKeeKK--LPQeK4-4PKKPK4--4KKjL5-">
        <st-name>Lost Words: Beyond the Page</st-name>
      </st-cover-micro>
      <st-slug>/lost-words</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/cc97434908874852a6705d255a605dc8rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/2kCxK4RBFczSk6MkdkTkSkQBUlbLsyArUthlU9bGgFFusu7oQyqlkEeQ2pOQKc0ET21E9mHnYi7ZtO7LHcT4ioRaJ6Ptd3M0aQtlZUS8Ln2STfu4VnoRT2RUmA=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="fjeefeyyfjjefPeePPeeeLeeeLKPKKKKKKKLKLKKKKKG0KKKKKLK4KKK--------">
        <st-name>The Crew 2</st-name>
      </st-cover-micro>
      <st-slug>/the-crew-2</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/632522c846a041ce801e47b96ba2e265rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/XpxTMzlfiY_QVuMczGmKz27M-e1LSYgjAXgkxjqZ9hTQczuKvWygchjUsHuSMTPmaGwaVIdhNshnCV_0KRPC0I-9LhSzoxvovPugkPS7iEk5QD80_u8LAUJZDmmC=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="000ee440044PeK50044LLK4040455LK4444555KK444454K4444455444044450K">
        <st-name>DOOM Eternal (BATTLEMODE)</st-name>
      </st-cover-micro>
      <st-slug>/doom-eternal</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/d43cd46c81734ca48e1a615310d0237crcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/HnSVyiTeu_zsT7C-dxG3frw0tDebA3w5FljafuQgCNouwYPzUn8EEVGzl3PDSMckBV39zu7jr1N0-IwGxTmfeyPqHbfAU2AgVd5ruoW9A0LQ69qbecm_cszC_Q=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="K-LeeKKKK-LLPLKKe-LejLKaK-KPeKKeK-KKK4KKK0KeKK-KK-KeK0----0K0---">
        <st-name>The Division 2</st-name>
      </st-cover-micro>
      <st-slug>/the-division-2</st-slug>
    </a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/cabec52b78264dafac69011aeacd5753rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/ZHeKdW-PB3G9cBNdSXeAfgifG5W3Prdorbp2ls5sTcagawXgWrfkapPRWar8WQOi_5aMEVBQ8XDAeTt5m8vXyimQ4jl_-IGGdhwjRVXAqEThHMQA00zA8uu68DY=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="PeeeePPPeefLfPKPeeeLPjfefePLLeefePLKLeeeePLPPPeeeeeePfeeeeefeeee">
        <st-name>Serious Sam Collection</st-name>
      </st-cover-micro>
      <st-slug>/serious-sam-collection</st-slug>
    <st-badge title="Serious Sam Collection was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/921e9afe46aa478fb4aa929a7b1a6bd5rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/lTEK8iolPxfpLSH1thdzax2zM3z7q3GdVVwRYocHMpKhJIQXH6IWTBetwl8tGFIYzNpjYFr0uRlR5NazF2L-J-OfPlRNQjqWMWztcd8d7eKrOLi162BGbOvpAk0=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="FFKKKGFFFFKKKKFFFGeKeeFFFKKK-KFFFKKL3KFFFGKLOKFFFKKKPKFFF-KK4K0F">
        <st-name>Spitlings</st-name>
      </st-cover-micro>
      <st-slug>/spitlings</st-slug>
    <st-badge title="Spitlings was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game><a href="https://stadia.google.com/player/d50e1c1b61224bceb65da9406f3f4e8frcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/naMIrWahw0AhZWz4o2SZ3xRl6X8E_xMhOPfoCrHBWBgphrPnkWqFDqWSGKqqVD6IqlklxEuyAtRj1sr9v1-f9kygJkraPUYt_2-GjIQCcU7UY5BhDqkks_-NBg=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="eeeeuK--eKede---dLKeK---ePKK3---_KKJ----J-----------------------">
        <st-name>Monster Energy Supercross - The Official Videogame 3</st-name>
      </st-cover-micro>
      <st-slug>/monster-energy-supercross-3</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/11c9ece5b3a045908d77cf2b66adb010rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/-GKLnidAoFP8KcBJtCHolYfbuXKL8ZXAZ7KrCafgMVTkaujez7vP16PcMZqR7MFcObEHx7lFTdKbcLeHAmY2uBQ5mMP-dsjr_0qeU-sgbevgb_Jr-0mQWm3g51j0=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="duddKddd_uuKKdddKeedKeteKdueeeueKdeKded_K_eKKeKKKK_PedKKJKKeeeKJ">
        <st-name>Tom Clancy's Ghost Recon Breakpoint</st-name>
      </st-cover-micro>
      <st-slug>/ghost-recon-breakpoint</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/be080ad40b434ca289166031d3e88623rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/ElwPBLa_oGlCx7q7aLfCax-QqGINwBywafU5X4Ks-fu7SllN2qRxJID7Cz_oRihzTRyrJL23CaVQwEe2WX19nsFYHXU8t6baod9429xje3P00uVl9b_roNGFS3M=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="JZ_ZJZZJZ_ePLP_JZdPPPPdJZuefPudJZuePPedJKuPLPKdZKKL5LKt_1L0KL4KL">
        <st-name>Borderlands 3</st-name>
      </st-cover-micro>
      <st-slug>/borderlands-3</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/80a70c13987841b3a2aedbcac54784abrcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/uD6WALL3-sc6mOhy2qtmXh_8ozAAOoc6sIjb4EaaU8c9c9S_VRs8pxpUmIqP_OkgzUfSBF2y7JsF_0tWk-2waf09-m0VqGt47JqWzBFF4_-oTq8-KUkUNkCWhnA=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="Kezuuzzz-eeQ-ezz-ezPKezz-Kz40jzz-ee-4ezz-KJ-ePezKK-00KLze---FLez">
        <st-name>DRAGON BALL XENOVERSE 2</st-name>
      </st-cover-micro>
      <st-slug>/dragon-ball-xenoverse-2</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/f39390395ed5444d8e9b23460c8f9152rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/gxrZ7kbuRLS_p5KaZKqNK-JmE0lxQ8tvVrJ5eCYqNVzcnkqfMYaswKO7ctPiP_f8WYIrrDfcpi65KXJgDyQwGzr5vTXNRp98gsuyCfT5KwPBSGw8dPKnuclmwQo=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="zzzKKyzzzzezzeKzzzfzeeKezzeeeeKezzjeFKeezzeeKKKezeeK0KKezeKK-F0K">
        <st-name>Darksiders Genesis</st-name>
      </st-cover-micro>
      <st-slug>/darksiders-genesis</st-slug>
    </a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/ebf235012b054269af70eee901bc85cfrcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/oZzTsiThslnP2T3mNLws_nvsyHE5ed29JykpzhZStfhYOLVT2gCM9ltfJtLuk4qNgCErjGp1WUXjIH0ey_nJtsKsZzFGPVGIcMKwANeKuls0liaDkvwzye_aZDs=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="uyyuyuuuLKPLLKPPPePLLKKPeeePe4KQKKKKK34L04-KK-P4-44LKLL444LKLL4K">
        <st-name>Farming Simulator 19</st-name>
      </st-cover-micro>
      <st-slug>/farming-simulator-19</st-slug>
    <st-badge title="Farming Simulator 19 was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/ca805d3d37404654a91d2ea62fad7bd4rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/wSt9G8QWOlyr6r-JoEKlNZeA210QdmlPSuW5Svm5tHhkqpl34NkZ1G7a2wHxx-aw8HKlyoVlrxV3DhP8QBhAe-5R2UvmKF7221UzdMA0o5F1oPCSnS2W8dHUIo0=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="efzjjeePeLLLefeLePLLKeL4eePLPL4-eKP4K0--P44---KP4-4K-Kee-KKKKKPe">
        <st-name>GRID</st-name>
      </st-cover-micro>
      <st-slug>/grid</st-slug>
    <st-badge title="GRID was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/e5c6ec7bf437491ea4ac0917df8f9640rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/1BZb1p7JVXbv2jSjaUNYebDdUZhv9Rrnsm_feiKDwpzBFkEMmt-QOxXDR_Ae9KfD-aIB4Mx8oW1RKOQ6-gkOx90IHQjjgzxeaazXB2oE6UWocJ4IUvy6PEPSUg=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="ddduttd_dtyddttdtyedduutuyd__dytuyed_eyyuyyddyyyuuydeuyyuuudduyy">
        <st-name>Rise of the Tomb Raider: 20 Year Celebration</st-name>
      </st-cover-micro>
      <st-slug>/rise-of-the-tomb-raider</st-slug>
    <st-badge title="Rise of the Tomb Raider: 20 Year Celebration was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/120348c2707740b99b509fad49a2f45drcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/ugOc_Fupr2_LSLHA_-mnxJ23VAW1dBlHEvMB4TjH8UwfE3Z-r_JvUla5wE0OZq-HH491PNp1UU9KpBPHiW1kUR94Hikn9AH80CSlWWSiPIUfanEvfAU7CxHIpyhD=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="55PK0LQLPQQL0LPPQUQLKPQ5jjLPPPQPjjPLLPjQPQQLLQUQ5PP40PQQ45PLKLPP">
        <st-name>SAMURAI SHODOWN</st-name>
      </st-cover-micro>
      <st-slug>/samurai-shodown</st-slug>
    <st-badge title="SAMURAI SHODOWN was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/c121d8b3fa744b52b71bf3599cb3da7frcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/_p33ZpHqaQSZY78a-6PhjiqNucXh5ToiDd6HzWkeV_sjhUeGHLWzmTzfRgzaPkcmMFFmGyatpCVr1nIxcsf2_7uR4vPjTOGMoMzaWDl7yaiDhnT6oNv6ab0aXg=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="000000000515510--005L4---0L5400--4LLL0---4KKL0----04K-----300---">
        <st-name>Thumper</st-name>
      </st-cover-micro>
      <st-slug>/thumper</st-slug>
    <st-badge title="Thumper was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/42503ac2cfcf40018c15c86b86a5508drcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/ItdfhlmZlO02nwB2DXVUYjI9No4a8YneGd89WAtsQWQxIfuQtaNHNao7gA5ctMHgC-WTtPGjuuyK64Sv4nhEUYf6gwGELlxDePAdoKo1dGRhb9d64jyzPV4kQg=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="zzeedK4KeKeeeKK-eKKKLLKKeKKKLeeKeKPPeeK-eKKKee3-eKKLfK--KKKKeK--">
        <st-name>Tomb Raider</st-name>
      </st-cover-micro>
      <st-slug>/tomb-raider</st-slug>
    <st-badge title="Tomb Raider was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game><a href="https://stadia.google.com/player/8b7e7f7036e5483eaa8745d46248536crcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/-yVMpBzhUPohpKlazmJ4WwxCztfqFxTOAZPr28tmhvvbxsWJohHUA_XNEBiTpBB5iRZTq7-AO5asjjUkNUkJCCRtFNHMskctMRk1nz419phwp4zA4CSxcuN4ops=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="fzzyeeeKeyzzedKKzzzzeKKKjezzeKKKezzzeKPLKefyeKeKKKeeePPK44LPPKKK">
        <st-name>Assassin's Creed Odyssey</st-name>
      </st-cover-micro>
      <st-slug>/assassins-creed-odyssey</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/a38d988fb142400c947bf0a7b37fd404rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/eXP-01YmEHqfR_f4gkKS_-Apcgo8GS1QIgtRVw-71dif6VqU40nZuKedr0wKZi8S6oGF1ZTJCxc7FIKWLYJzgtCU7wAs7SWLCSbG3eJ_kakEVZ4oB9UE2C7RrjPW=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="LK5LLL4PKKK5554L4K4445455LLLK5L5KLLP4LPL4KLL4LLKKLKPLLLKKKLefPLK">
        <st-name>Attack on Titan 2: Final Battle</st-name>
      </st-cover-micro>
      <st-slug>/attack-on-titan-2-final-battle</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/a447622dbe084c3e9ace4f913a939afarcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/shHWB-5Z_PGMIvjqsGo7zPb4Xeo1OZX1bDgbis5tJuACtGxO7LcJsGZOVr0UdodTzP77KQuOw52t4bsFAUhVpLHVnSMnPrnVB2OgAI_A8zVLcQ2oII_VLAD1aPo=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="KK_dK__KKeKdK_KKKeKeKKKKKKKLKKKKKKKKKKKKKG0KKJKK----KKK---------">
        <st-name>FINAL FANTASY XV</st-name>
      </st-cover-micro>
      <st-slug>/final-fantasy-xv</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/8a3cc52ad2334b1e91ded77bc43644e0rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/bhTAE9AYFT9fsWHReXauJCbrg4wWx6JcnDllgHNjkF0VAZyxxSpqzldY7GW13GkY9XD2lJ-pE4fh9bdD3J4zhqgCHEyqVhg5jVnYf4DJe-HvYY-wmttKn3tp6bUP=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="-KKKKKK-KKeeeeKKKKKKKKKKKLKPKLKKKPPLKKKK0L9K__KK-44Ke_KKK49LKedK">
        <st-name>Football Manager 2020</st-name>
      </st-cover-micro>
      <st-slug>/football-manager-2020</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/4b7f307c37364d659118bf7d435733c7rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/TI1PWXCuH739YBSZev3xdW0gaCIKLxuMX77jGqIOMMgNMFL8gSeGbpbK7-txwqlUAyrYOLyAIkdlOQcCFy3mkEPDDhQ6T_I8d_ISPV6a3a3ObcnBX6VodClyh9M=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="IMMMMQQQILPfeePQHLdfe_PPaLLev_aaaLLafL_aaaK_a___a_______________">
        <st-name>Just Dance 2020</st-name>
      </st-cover-micro>
      <st-slug>/just-dance-2020</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/da94f3aa88b24eb6ae6fdff798f73355rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/AxTeMN7KoEfDyyIHZLs583DTjg0p76d1ZG5j6C132xKkUefj5YkTDvANslKFTu1cthegaR5HwVjhwUwQLsLOP0aWlPMDxR4SXaS9tRZPXOvitq8Y6JQdtu0VVM8=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="-FFFF---FeaKFKKF___KFeK__GK_WKK___a__LK___aaaKKK__aaaKKK__a__KKK">
        <st-name>Kine</st-name>
      </st-cover-micro>
      <st-slug>/kine</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/7bfbcba307114ab88ae4231da2ec85d3rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/xKyKXgRVcyPnjVR84frvPqHDR2NMqxoiEjpQ4_D36mJfv5lYBB4B5qZD28mfAISwyXxM5iqa8AOz_uB7XpOQgMO_k6oVvip3lNf2BEr3-uRdiruUpZpXbcj5Fw=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="QQUULQAAQQUPQUAAQQU4PQQAAQQKPQQAAAQKLQQAAAQ445A6AAQ55965AAA55955">
        <st-name>Mortal Kombat&nbsp;11</st-name>
      </st-cover-micro>
      <st-slug>/mortal-kombat-11</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/2afad3696b394f669b49e4c0b6016958rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/-uLRlJISNpQDASN8PoN4q6-dP-B9UnB0uh6KijKcQMiRj_Ao4_SzCK04ZdGUU3tBOXFotkHKM5CeFhGRE6WIaB-mUDAEvmez5zlUhPeqxmPsqxJhqTfpSvljfz0=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="-KKKKKeG0eeeLLe0-00GKL000G0LLL000LLLLLL000LL5ef0-0000LL00KG-1LL4">
        <st-name>NBA 2K20</st-name>
      </st-cover-micro>
      <st-slug>/nba-2k20</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/8615c857d7d54efebd94fe17e3f2896crcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/VGx-oO8_VZaUYQ49tt-jTfXvortTQDIX_ozUFRrFnV5yHh2sWtPlGJdpGQJgWJOiKby8Xy9xZn97X32JFRya92Rbm0zOAdzo3hbqnfZRS1w6jImtFYRTW0rMjBA3=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="zLeefeFHQ0--0eKHPKKKLLef4KeKf4ef-4jeL0La4KbLL0LLPKaKKK5LL-95059E">
        <st-name>RAGE 2</st-name>
      </st-cover-micro>
      <st-slug>/rage-2</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/2152a1e96d5b47b18a5df7ca9bb0751frcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/jhtBIrm5tJOHNH80qwEtKYFMYsEX8JRcC1Qa-DcF1n4SNWJ8u0MqmSczVKNlCqLfZCU3Ldb_xxQjMwjpPnDuqbQBEDa8Xdrq60vK5dpW8-yE6V2wRII3qrF7PyI=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="111111111HH16L41Lee1PLA6LLL1LL5A1112L0561001K-010--0K-00----K-0-">
        <st-name>Red Dead Redemption 2</st-name>
      </st-cover-micro>
      <st-slug>/red-dead-redemption-2</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/efa3b6108d3e41689b2223ba9d48f5c8rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/ztnbk63kaMsX8xq4VM1mdQzzeV4hc3RIsQ1dTtjDbbSiYbivqY23FqHk_sCo883A1pJeUKw1EFmhn_vZiednBSQGa7lvvVpLXIliOa-5sAYbJewYS-vW9lpwUf4=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="--KKK0---0PeeK---KPfLL---4LeGP---KLLKK---KKK4K----KK-K----KK4K3-">
        <st-name>Shadow of the Tomb Raider</st-name>
      </st-cover-micro>
      <st-slug>/shadow-of-the-tomb-raider</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/a031419410cc48469ff8954ea0732640rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/yboeUZCnPqzW-B4pHW8XyT3khyMK4n0D-1Tcsgv2aoJ3eh3S3JwblvGsW6Emf0hGQwq9pK6Kao2TSAp4Lek5Bx-GDTcKmDYlUbZjdjh7VpEaHZ9JuXjam5IpRig=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="FeeeK__KKeyKKd_dKezdOe_KKeeededKK_eKeeeKKeeeeeKJKKeeePKKGKeeeKKF">
        <st-name>Trials Rising</st-name>
      </st-cover-micro>
      <st-slug>/trials-rising</st-slug>
    </a></st-game>
    <st-game><a href="https://stadia.google.com/player/4884bd9bd7864cf28deef05ef4b69e70rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/P6EgUVCNV8cHMnYL4RuIm580nj-uuFo3tEYm_t7Jsl79lBRwcvDahX0shJ4IV6LVDx8d8hsJAU29MGYfgIbZ6Iu0WeX7cUtvOnbPh3wGyxJhz20Ql28FJ67qGOQ=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="F_t_FKKFFZ__JeeKJF_____JFFKJ_KKG-GKJ_KG0FKKKLLL0FKLLLGLKFFLLf0KK">
        <st-name>Wolfenstein: Youngblood</st-name>
      </st-cover-micro>
      <st-slug>/wolfenstein-youngblood</st-slug>
    </a></st-game>
    <st-game previously-pro><a href="https://stadia.google.com/player/879d82512f5441829250ead1aa678a70rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/iWFjkPBXJMKBpQUlz-tAfVPmTzVuG1WerY_EkrmfypWwNzuh13f0WINdYAqcqUeMVCGxUiOXSKzX_Lx-OdtP_TprNnP3PTEirwePLnfn2lKxTIOjHJFfEdzPpkw=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="-KKKKKJ--KKKKKKFFK_eeeKJKKdeueKKFKeyeeKKFKeuueKKK_euee_K-eeeede-">
        <st-name>Metro Exodus</st-name>
      </st-cover-micro>
      <st-slug>/metro-exodus</st-slug>
    <st-badge title="Metro Exodus was previously included with Stadia Pro." previously-pro>previously<br>PRO</st-badge></a></st-game>
    <st-game pre-order><a href="https://stadia.google.com/player/9affbc684aeb422086bfb5d0c8bf2f55rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/s99HrR_vNltBWUYG1WRkPgzSwQQzbYyreVhBKw-LYhV2LJXhHxqGAAZAY0qLWOyQZickdC4qXs6ifisdMlUNfGQqnaJcfQH1xYdlPe7XPBlBynW___rjvsOj_g=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="F______F-FLLLKFFFKGK_GKFFGFPPFGFF0FPUFGFG0F4EJGF05G9PGGFGH-GGGGF">
        <st-name>PAC-MAN Mega Tunnel Battle</st-name>
      </st-cover-micro>
      <st-slug>/pac-man-mega-tunnel-battle</st-slug>
    <st-badge title="PAC-MAN Mega Tunnel Battle is available for pre-order, but not yet released." pre-order>pre-order</st-badge></a></st-game>
    <st-game pre-order><a href="https://stadia.google.com/player/deb490c166544813bf2ab73f4c6e2aa0rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/KarRixCnRZrIEEMqIczRfXG69sXH3QzO2mVcONtbDvJ34Y3W1kgZCS44vX59xFP0P7LGb7RDv_z0ERj6Me6mUE7t4nSW3q35NcBvHpL9QVjLP44X6sypOZENAA=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="K-JKKK-KeFJKKKFGeFKKFKFF_KJGK_KJKKKGK_e_aLLK_KeeeeKK_KK_KKK0F0GK">
        <st-name>Watch Dogs: Legion</st-name>
      </st-cover-micro>
      <st-slug>/watch-dogs-legion</st-slug>
    <st-badge title="Watch Dogs: Legion is available for pre-order, but not yet released." pre-order>pre-order</st-badge></a></st-game>
    <st-game pre-order><a href="https://stadia.google.com/player/161f276db10947a199cd0260ed4dc248rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/VDyK9Am5dtjlUWUy-_rN7GnhC__2pHBfFt4FJ7TnkcByg7v1jML0CVWjKIjdMX6N3bp8DrO5vZYdm8OFW3q1bHWvZhCBod5e9IEvv-c2zj9qAxEqlNNSi5FOp5s=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="KeuddKeuKdetKLeeKeeeKKKtKdeeeKduKdeeeKeeKdeeePPe-KeeeeeK-KeeeKKK">
        <st-name>IMMORTALS FENYX RISING</st-name>
      </st-cover-micro>
      <st-slug>/immortals-fenyx-rising</st-slug>
    <st-badge title="IMMORTALS FENYX RISING is available for pre-order, but not yet released." pre-order>pre-order</st-badge></a></st-game>
    <st-game pre-order><a href="https://stadia.google.com/player/49697e672bc34e7d8a5f73f78cb580d0rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/BOuaOB_B-RNqxvOl2s4o2dERqzN6YRDfwvNWHHYYflVNbp6pBv1vftW_ZQriNA7IdEMUVmh1B6mz0V8Q8Uqax9Y9EhpOmDf0HOAisiYWFjiV-3VkNirV3I4q-w=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="EEE9KEEEEEPPLEEEEE9KK9EEEEK4K4EEEE44K4EAEE9-04EEEEE--4EE999--K99">
        <st-name>Cyberpunk 2077</st-name>
      </st-cover-micro>
      <st-slug>/cyberpunk-2077</st-slug>
    <st-badge title="Cyberpunk 2077 is available for pre-order, but not yet released." pre-order>pre-order</st-badge></a></st-game>
    <st-game pre-order><a href="https://stadia.google.com/player/3f40802097224fa1aaa0dcc4555828b7rcp1">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/QzBENJtMbRqPkxvIzln455pA5uVYMcIrNfIdLksA1WULf0zSH4sGcOx11dulF8C2oxxjTqYoMn2WIA88QpmuY7zFVxkf4EXG-pjHThh9evrvk_LRWgjqNE3rljI=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="JJJJJJJJJKJJJJJJKKKKJJJJKKae_d__FKLffea_KKKLaKKKJKKKKKKKJFFFF-FF">
        <st-name>HUMANKIND</st-name>
      </st-cover-micro>
      <st-slug>/humankind</st-slug>
    <st-badge title="HUMANKIND is available for pre-order, but not yet released." pre-order>pre-order</st-badge></a></st-game>
    <st-game demo delisted=""><a href="https://stadia.google.com/store/details/6363b82d1cc442f5af9c3ce98ceb731drcp1/sku/371cce816e0d4af294733dc22bbc680cp">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/m6YZo3cHZv5f6oB1MxR4GvERe-Xr03JfdrgvkVpyRo-_aq5fv1tZsY6vLBybw9nKBgWIWty9jdToWJjZCfzk-zJfakdzPsGxQkrQin8s92_jMbXbrte69NvKEw=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="KeuddKeuKeetKLeeKeeeKKKtKeeeeKduKdPeeKeeKdeeePPe-KeeeeeK-KeeeKKK">
        <st-name>Immortals Fenyx Rising Demo</st-name>
      </st-cover-micro>
      <st-slug>/immortals-fenyx-rising-demo</st-slug>
    <st-badge demo>demo</st-badge><st-badge title="Immortals Fenyx Rising Demo has been delisted from the Stadia store; it is no longer available." delisted>delisted</st-badge></a></st-game>
    <st-game demo delisted=""><a href="https://stadia.google.com/store/details/243c716cb0834b5bbce536902dd23a5frcp1/sku/6d54e2f977514da38090c19655c61badp">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/hW4n1eVq4skOVMGFHntTtqzPvDT3AV0aN3zsxfv3hq9N_1sa284lp7UkTfTo0X49tWCqTTrnCgUX0nKtY-wmoscarB6xeiQFydSOV1esE7OfDWp-P4dDGFLOeio=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="JJJJJJJ_JJJJJJJJKGKKJJJJGKaauu_JGKKbaaaKGKKLfKKKJKKFGFKKFFGFF-FF">
        <st-name>HUMANKIND - OpenDev Beta</st-name>
      </st-cover-micro>
      <st-slug>/humankind-opendev-beta</st-slug>
    <st-badge demo>demo</st-badge><st-badge title="HUMANKIND - OpenDev Beta has been delisted from the Stadia store; it is no longer available." delisted>delisted</st-badge></a></st-game>
    <st-game demo delisted=""><a href="https://stadia.google.com/store/details/242d8ba9ba48460c88560a847a0c7c96rcp1/sku/f00f5466907349c79467115296491b0fp">
      <st-cover-full>
        <img src="https://lh3.googleusercontent.com/ELr2HXAK6OK8ulPG7BIC82sS0PSnUiBhXi0kltXr8f46174Sas_oXtRtQKbKqklQY4FCaDvUV5Ai_PTJXpjVDUaWTYUHHAgVxwlKvsDLxXs4_KAKXtjwBvswTA=w640-h360-rw">
      </st-cover-full>
      <st-cover-micro data="qqqqqqqq-K_____FFKJKKJ_FFGFKOFGFF0FKUFGFG0F4UFGF05GLPGGFGH-GGGGF">
        <st-name>PAC-MAN Mega Tunnel Battle DEMO</st-name>
      </st-cover-micro>
      <st-slug>/pac-man-mega-tunnel-battle-demo</st-slug>
    <st-badge demo>demo</st-badge><st-badge title="PAC-MAN Mega Tunnel Battle DEMO has been delisted from the Stadia store; it is no longer available." delisted>delisted</st-badge></a></st-game>
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
    navigator.serviceWorker.register('/-service-worker.js', {scope: '/'});
  }
});

export const searchForm =
  globalThis.document && document.querySelector("st-search form");
export const searchInput = searchForm && searchForm.querySelector("input");
export const searchButton = searchForm && searchForm.querySelector("button");
export const gameTiles =
  globalThis.document && document.querySelector("st-games");

export const skus = new Map();

export const digits =
  "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";

export const cleanName = name =>
  name
        .replace(/™/g, " ")
        .replace(/®/g, " ")
        .replace(/[\:\-]? Early Access$/g, " ")
        .replace(/[\:\-]? \w+ Edition$/g, " ")
        .replace(/\(\w+ Ver(\.|sion)\)$/g, " ")
        .replace(/™/g, " ")
        .replace(/\s{2,}/g, " ")
        .replace(/^\s+|\s+$/g, "");


export const slugify = (name, separator = "-") =>
    cleanName(name)
    .normalize('NFKD')
    .replace(/\p{Mark}/gu, '')
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^\-+|\-+$/g, "")
    .replace(/\-/g, separator);

export const loadedImage = async (/** @type string */ url) => {
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.crossOrigin = "anonymous";
    image.src = url;
  });
  return image;
};

export const unpackMicroCovers = async () => {
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

export const u6toRGB = u6 => {
  const red =
    (u6 & 0b000010 ? 0b10101010 : 0) + (u6 & 0b000001 ? 0b01010101 : 0);
  const green =
    (u6 & 0b001000 ? 0b10101010 : 0) + (u6 & 0b000100 ? 0b01010101 : 0);
  const blue =
    (u6 & 0b100000 ? 0b10101010 : 0) + (u6 & 0b010000 ? 0b01010101 : 0);
  return [red, green, blue];
};

export const microImageToURL = microImage => {
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
      let slug = child.querySelector("st-slug").textContent.replace(/\/+/, '');

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
`
};

export default { html };

