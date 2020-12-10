import { encode as jsonEncode } from "../../../_common/json.ts";

import type { Games } from "./mod.ts";

export const json = ({ games, name }: { games: Games; name: string }) => {
  const latestProGames = games.filter((g) => g.pro || true).sort((a, b) =>
    (a.skuPublished ?? 0) - (b.skuPublished ?? 0)
  ).slice(0, 16);

  return jsonEncode({
    "background_color": "#202020",
    "description": "a lightning-fast launcher for Stadia",
    "display": "standalone",
    "icons": [
      {
        "purpose": "maskable",
        "sizes": "560x560",
        "src": "/pwa.png",
        "type": "image/png",
      },
      {
        "purpose": "any",
        "sizes": "420x420",
        "src": "/stadian.png",
        "type": "image/png",
      },
    ],
    "name": name,
    "short_name": name,
    "shortcuts": latestProGames.map((game) => ({
      "icons": [
        {
          "sizes": "192x192",
          "src": `${game.coverImageUrl}=s192-p-rp`,
        },
      ],
      "name": game.name,
      "url": `/${game.slug}`,
    })),
    "start_url": "/",
    "theme_color": "#202020",
  }, 2);
};

export default { json };
