/** Loosely-structured view models parsed from Stadia page responses. */
import { SQL, Database } from "../../deps.ts";
import { assert, notImplemented } from "../../_common/assertions.ts";
import { Json } from "../../_common/types.ts";

import { Client as ResponsesClient } from "./responses.ts";

export const StadiaWebView = SQL`StadiaWebView`;

export const schema = SQL`
create table if not exists StadiaWebView (
    [requestId] integer primary key references StadiaWebResponse(requestId),
    [view] json text
  );
`;

export type StadiaWebView =
  & Page
  & (
    | ({ type: "PlayerProfilePage" } & PlayerProfilePage)
    | ({ type: "PlayerGamesPage" } & PlayerGamesPage)
    | ({ type: "PlayerGameStatsPage" } & PlayerGameStatsPage)
    | ({ type: "HomePage" } & never)
    | ({ type: "CapturesPage" } & never)
    | ({ type: "SettingsPage" } & never)
    | ({ type: "GamePlayerPage" } & never)
    | ({ type: "StoreFrontPage" } & never)
    | ({ type: "StoreListPage" } & never)
    | ({ type: "StoreSkuPage" } & never)
    | ({ type: "StoreListPage" } & never)
  );

export class Client extends ResponsesClient {
  protected async initializeDatabase(database: Database) {
    await super.initializeDatabase(database);
    await database.query(schema);
  }

  public async fetchView(path: string) {
    const { request, httpResponse, response } = await this.fetchResponse(path);

    const wizGlobalData = response.wizGlobalData as Record<string, Json>;
    const ijValues = response.ijValues as Record<string, Json>;
    const afPreloadData = response.afPreloadData;

    const googleId = wizGlobalData?.["W3Yyqf"];

    if (googleId !== this.googleId) {
      throw new Error("Google ID in response did not match credentials");
    }

    const userInfo = afPreloadData?.["D0Amud"]?.[0]?.value;
    assert(userInfo instanceof Array);

    const shallowUserInfo = userInfo?.[5] as any;
    assert(shallowUserInfo instanceof Array);

    const gamerTagName = shallowUserInfo?.[0]?.[0];
    assert(gamerTagName && typeof gamerTagName === "string");

    const gamerTagNumber = shallowUserInfo?.[0]?.[1];
    assert(gamerTagNumber && typeof gamerTagNumber === "string");

    const gamerTag = gamerTagNumber === "0000"
      ? gamerTagName
      : `${gamerTagName}#${gamerTagNumber}`;

    const avatarId = parseInt(shallowUserInfo?.[1]?.[0]?.slice(1), 10);
    assert(Number.isSafeInteger(avatarId));

    const avatarUrl = shallowUserInfo?.[1]?.[1];
    assert(avatarUrl && typeof avatarUrl === "string");

    const gamerId = shallowUserInfo?.[5];
    assert(gamerId && typeof gamerId === "string");

    const view = {
      googleId,
      gamerId,
      gamerTagName,
      gamerTagNumber,
      gamerTag,
      avatarId,
      avatarUrl,
    } as unknown as StadiaWebView;
    const row = null as unknown;

    return { row, request, httpResponse, response, view };
  }
}

interface SkuModel {
  skuId: string;
  name: string;
  imageUrl: string;
}

interface GameModel {
  gameId: string;
  skuId?: string;
  name: string;
}

interface PlayerModel {
  stadiaId: string;
  gamerTag: string;
  avatarId: number;
  lastActiveTimestamp?: number;
  currentGameId?: string;
}

interface AchievementModel {
  name: string;
  index: number;
  description: string;
  imageUrl: string;
  completionPercentage: number;
  completionTimestamp?: number;
}

interface Page {
  pageTimestamp: number;
  clientGoogleId: string;
  clientGoogleEmail: string;
  clientPlayer: PlayerModel;
  countryCode: string;
  currencyCode: string;
}

interface PlayerProfilePage extends Page {
  player: PlayerModel;
  friendPlayers?: PlayerModel[];
  recentlyPlayedGameIds?: null | string[];
}

interface PlayerGamesPage extends Page {
  player: PlayerModel;
  playedGameIds?: null | string[];
}

interface PlayerGameStatsPage extends Page {
  player: PlayerModel;
  game: GameModel;
  totalAchievementCount?: number;
  completedAchievements?: AchievementModel;
  lastPlayedTimestamp?: number;
  allTimeSeconds?: number;
  lastSessionSeconds?: number;
  stats?: {
    key: string;
    label: string;
    value: string | null;
  }[];
}
