import { encode as jsonEncode } from "../../../_common/json.ts";

import type { Games } from "./mod.ts";

export const json = ({ games }: { games: Games }) => {
  return jsonEncode({
    github: {
      silent: true,
    },
    rewrites: [
      {
        source: "/([a-z0-9\-]+)",
        destination: "/index.html",
      },
    ],
    redirects: games.map((game) => ({
      statusCode: 301,
      source: `/${game.slug}`,
      destination:
        `https://stadia.google.com/setup?redirect_to=https://stadia.google.com/player/${game.gameId}`,
    })),
  }, 2);
};

export default { json };
