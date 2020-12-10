import { encode as jsonEncode } from "../../../_common/json.ts";

import type { Games } from "./mod.ts";

export const json = ({ games, name }: { games: Games; name: string }) => {
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
    "shortcuts": games.slice(0, 16).map((game) => ({
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
