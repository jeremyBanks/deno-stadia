/** Loosely-structured view models parsed from Stadia page responses. */
import { Database, SQL } from "../../deps.ts";
import { assert, notImplemented } from "../../_common/assertions.ts";
import { Json } from "../../_common/types.ts";

import {
  Client as ResponsesClient,
  JsProtoArray,
  StadiaWebResponse,
} from "./_responses.ts";

export class Client extends ResponsesClient {
  public async fetchView(path: string) {
    const { request, httpResponse, response } = await this.fetchResponse(path);

    const wizGlobalData = response.wizGlobalData as Record<string, Json>;
    const ijValues = response.ijValues as Record<string, Json>;
    const afPreloadData = response.afPreloadData;

    if (this.googleId && wizGlobalData?.["W3Yyqf"] !== this.googleId) {
      throw new Error("Google ID in response did not match credentials");
    }

    const page = Page.from(
      request.path,
      wizGlobalData,
      ijValues,
      afPreloadData,
    );

    return { request, httpResponse, response, page };
  }
}

abstract class ViewModel {
}

const skuTypeIds = {
  1: "game",
  2: "addon",
  3: "bundle",
  5: "bundle-subscription",
  6: "addon-subscription",
  10: "preorder",
};

class Page extends ViewModel {
  pageType: string = this.constructor.name;
  userGoogleId: string;
  userGoogleEmail: string;
  userPlayer: Player;

  static from(
    path: string,
    wizGlobalData: Record<string, Json>,
    ijValues: Record<string, Json>,
    afPreloadData: StadiaWebResponse["afPreloadData"],
  ): Page {
    if (path === "/") {
      return new Home(wizGlobalData, ijValues, afPreloadData);
    } else if (path.match(/^\/profile(\/\d+)$/)) {
      return new PlayerProfile(wizGlobalData, ijValues, afPreloadData);
    } else {
      return new Page(wizGlobalData, ijValues, afPreloadData);
    }

    return notImplemented();
  }

  constructor(
    wizGlobalData: Record<string, Json>,
    ijValues: Record<string, Json>,
    afPreloadData: StadiaWebResponse["afPreloadData"],
  ) {
    super();

    this.userGoogleId = wizGlobalData["W3Yyqf"] as any;
    this.userGoogleEmail = wizGlobalData["oPEP7c"] as any;
    this.userPlayer = Player.fromProto(
      afPreloadData["D0Amud"].find((x: any) => undefined === x.arguments[4])!.value as any,
    );
  }
}

class Home extends Page {}

class PlayerProfile extends Page {
  profilePlayer: Player;

  constructor(
    wizGlobalData: Record<string, Json>,
    ijValues: Record<string, Json>,
    afPreloadData: StadiaWebResponse["afPreloadData"],
  ) {
    super(wizGlobalData, ijValues, afPreloadData);
    this.profilePlayer = Player.fromProto(
      afPreloadData["D0Amud"].find((x: any) => undefined !== x.arguments[4])!.value as any,
    );
  }
}
class PlayerProfileGameList extends Page {}
class PlayerProfileGameDetail extends Page {}
class StoreFront extends Page {}
class StoreList extends Page {}
class StoreSkuWithoutGame extends Page {}
class StoreSku extends StoreSkuWithoutGame {}

class Player extends ViewModel {
  constructor(
    readonly gamerId: string,
    readonly gamerName: string,
    readonly gamerNumber: string,
    readonly avatarId: number,
  ) {
    super();
  }

  get gamerTag() {
    return this.gamerNumber === "0000"
      ? this.gamerName
      : `${this.gamerName}#${this.gamerNumber}`;
  }

  static fromProto(proto: JsProtoArray): Player {
    const shallowUserInfo = (proto as any)[5];
    assert(shallowUserInfo instanceof Array);

    const gamerName = shallowUserInfo?.[0]?.[0];
    assert(gamerName && typeof gamerName === "string");

    const gamerNumber = shallowUserInfo?.[0]?.[1];
    assert(gamerNumber && typeof gamerNumber === "string");

    const avatarId = parseInt(shallowUserInfo?.[1]?.[0]?.slice(1), 10);
    assert(Number.isSafeInteger(avatarId));

    const gamerId = shallowUserInfo?.[5];
    assert(gamerId && typeof gamerId === "string");

    return new Player(gamerId, gamerName, gamerNumber, avatarId);
  }
}

class Game extends ViewModel {
  static fromProto(proto: JsProtoArray): Game {
    return notImplemented();
  }
}

class Sku extends ViewModel {
  static fromProto(proto: JsProtoArray): Sku {
    return notImplemented();
  }
}
