/** Loosely-structured view models parsed from Stadia page responses. */
import { Database, log, SQL } from "../../deps.ts";
import { assert, notImplemented } from "../../_common/assertions.ts";
import { Json } from "../../_common/types.ts";
import { eprintln, println } from "../../_common/io.ts";

import {
  Client as ResponsesClient,
  JsProto,
  StadiaWebResponse,
} from "./_responses.ts";

export class Client extends ResponsesClient {
  public async fetchHome(): Promise<Home> {
    return (await this.fetchView("/")).page as Home;
  }

  public async fetchPlayerProfile(gamerId?: string): Promise<PlayerProfile> {
    let path = `/profile${gamerId ? `/${gamerId}` : ``}`;
    return (await this.fetchView(path)).page as PlayerProfile;
  }

  public async fetchPlayerProfileGameList(
    gamerId?: string,
  ): Promise<PlayerProfileGameList> {
    let path = `/profile${gamerId ? `/${gamerId}` : ``}/gameactivities/all`;
    return (await this.fetchView(path)).page as PlayerProfileGameList;
  }

  public async fetchPlayerProfileGameDetails(
    gameId: string,
    gamerId?: string,
  ): Promise<PlayerProfileGameDetails> {
    let path = `/profile${gamerId ? `/${gamerId}` : ``}/detail/${gameId}`;
    return (await this.fetchView(path)).page as PlayerProfileGameDetails;
  }

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

class Page extends ViewModel {
  pageType: string = this.constructor.name;
  path: string;
  userGoogleId: string;
  userGoogleEmail: string;
  userPlayer: Player;

  static from(
    path: string,
    wizGlobalData: Record<string, Json>,
    ijValues: Record<string, Json>,
    afPreloadData: StadiaWebResponse["afPreloadData"],
  ): Page {
    if (/^\/(home)?$/.test(path)) {
      return new Home(path, wizGlobalData, ijValues, afPreloadData);
    } else if (/^\/profile(\/\d+)?$/.test(path)) {
      return new PlayerProfile(path, wizGlobalData, ijValues, afPreloadData);
    } else if (/^\/profile(\/\d+)?\/gameactivities\/all$/.test(path)) {
      return new PlayerProfileGameList(
        path,
        wizGlobalData,
        ijValues,
        afPreloadData,
      );
    } else if (/^\/profile(\/\d+)?\/detail\/[\da-z]+$/.test(path)) {
      return new PlayerProfileGameDetails(
        path,
        wizGlobalData,
        ijValues,
        afPreloadData,
      );
    } else if (/^\/captures$/.test(path)) {
      return new CaptureList(path, wizGlobalData, ijValues, afPreloadData);
    } else if (/^\/captures\/[\da-z\-]+$/.test(path)) {
      return new SharedCapture(path, wizGlobalData, ijValues, afPreloadData);
    } else if (/^\/store$/.test(path)) {
      return new StoreFront(path, wizGlobalData, ijValues, afPreloadData);
    } else if (/^\/store\/list(\/\d+)?$/.test(path)) {
      return new StoreList(path, wizGlobalData, ijValues, afPreloadData);
    } else if (/^\/store\/details\/[0\-]\/sku\/[\da-z]+$/.test(path)) {
      return new StoreSkuWithoutGame(
        path,
        wizGlobalData,
        ijValues,
        afPreloadData,
      );
    } else if (/^\/store\/details\/[\da-z]+\/sku\/[\da-z]+$/.test(path)) {
      return new StoreSku(path, wizGlobalData, ijValues, afPreloadData);
    } else {
      if (/^readonlystoredetails/.test(path)) {
        log.error(`/readonlystoredetails is weird and unsupported`);
      }
      log.warning(`Unknown page path: ${path}`);
      return new Page(path, wizGlobalData, ijValues, afPreloadData);
    }
  }

  constructor(
    path: string,
    wizGlobalData: Record<string, Json>,
    ijValues: Record<string, Json>,
    afPreloadData: StadiaWebResponse["afPreloadData"],
  ) {
    super();

    this.path = path;
    this.userGoogleId = wizGlobalData["W3Yyqf"] as any;
    this.userGoogleEmail = wizGlobalData["oPEP7c"] as any;
    this.userPlayer = Player.fromProto(
      afPreloadData["D0Amud"].find((x: any) => undefined === x.arguments[4])!
        .value as any,
    );
  }
}

class Home extends Page {}

class PlayerProfile extends Page {
  profilePlayer: Player;

  constructor(
    path: string,
    wizGlobalData: Record<string, Json>,
    ijValues: Record<string, Json>,
    afPreloadData: StadiaWebResponse["afPreloadData"],
  ) {
    super(path, wizGlobalData, ijValues, afPreloadData);
    this.profilePlayer = Player.fromProto(
      afPreloadData["D0Amud"].find((x: any) => undefined !== x.arguments[4])!
        .value as any,
    );
  }
}
class PlayerProfileGameList extends Page {
  constructor(
    path: string,
    wizGlobalData: Record<string, Json>,
    ijValues: Record<string, Json>,
    afPreloadData: StadiaWebResponse["afPreloadData"],
  ) {
    super(path, wizGlobalData, ijValues, afPreloadData);
  }
}
class PlayerProfileGameDetails extends Page {
  constructor(
    path: string,
    wizGlobalData: Record<string, Json>,
    ijValues: Record<string, Json>,
    afPreloadData: StadiaWebResponse["afPreloadData"],
  ) {
    super(path, wizGlobalData, ijValues, afPreloadData);
  }
}
class StoreFront extends Page {
  constructor(
    path: string,
    wizGlobalData: Record<string, Json>,
    ijValues: Record<string, Json>,
    afPreloadData: StadiaWebResponse["afPreloadData"],
  ) {
    super(path, wizGlobalData, ijValues, afPreloadData);
  }
}
class StoreList extends Page {
  constructor(
    path: string,
    wizGlobalData: Record<string, Json>,
    ijValues: Record<string, Json>,
    afPreloadData: StadiaWebResponse["afPreloadData"],
  ) {
    super(path, wizGlobalData, ijValues, afPreloadData);
  }
}
class StoreSkuWithoutGame extends Page {
  sku: Sku;
  parentBundles: Sku[];
  parentSubscriptions: Sku[];

  constructor(
    path: string,
    wizGlobalData: Record<string, Json>,
    ijValues: Record<string, Json>,
    afPreloadData: StadiaWebResponse["afPreloadData"],
  ) {
    super(path, wizGlobalData, ijValues, afPreloadData);

    const skuProto = afPreloadData["FWhQV"][0].value as JsProto[];
    this.sku = SkuWrapper.fromProto(skuProto).sku;
    this.parentBundles =
      ((afPreloadData["SYcsTd"] as any)?.[0]?.value[1].map((p: any) =>
        Sku.fromProto(p[9])
      ) || []) as Sku[];
    this.parentSubscriptions =
      ((afPreloadData["SYcsTd"]?.[0] as any)?.value[2].map(
        Sku.fromProto,
      ) || []) as Sku[];
  }
}
class StoreSku extends StoreSkuWithoutGame {
  addons: Sku[];

  constructor(
    path: string,
    wizGlobalData: Record<string, Json>,
    ijValues: Record<string, Json>,
    afPreloadData: StadiaWebResponse["afPreloadData"],
  ) {
    super(path, wizGlobalData, ijValues, afPreloadData);
    this.addons =
      ((afPreloadData["ZAm7We"] as any)?.[0]?.value[0].map((p: any) =>
        Sku.fromProto(p[9])
      ) || []) as Sku[];
  }
}
class CaptureList extends Page {
  constructor(
    path: string,
    wizGlobalData: Record<string, Json>,
    ijValues: Record<string, Json>,
    afPreloadData: StadiaWebResponse["afPreloadData"],
  ) {
    super(path, wizGlobalData, ijValues, afPreloadData);
  }
}
class SharedCapture extends Page {
  constructor(
    path: string,
    wizGlobalData: Record<string, Json>,
    ijValues: Record<string, Json>,
    afPreloadData: StadiaWebResponse["afPreloadData"],
  ) {
    super(path, wizGlobalData, ijValues, afPreloadData);
  }
}

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

  static fromProto(proto: JsProto): Player {
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
  static fromProto(proto: JsProto): Game {
    return notImplemented();
  }
}

const skuTypeIds = {
  1: "game",
  2: "addon",
  3: "bundle",
  5: "subscription-bundle",
  6: "subscription-addon",
  10: "preorder",
};

class SkuWrapper extends ViewModel {
  protected constructor(
    readonly sku: Sku,
  ) {
    super();
  }

  static fromProto(proto: Array<JsProto>): SkuWrapper {
    const sku = Sku.fromProto(proto[16] as Array<JsProto>);

    return new SkuWrapper(sku);
  }
}

class Sku extends ViewModel {
  protected constructor(
    readonly typeId: number,
    readonly type: string,
    readonly skuId: string,
    readonly gameId: string | undefined,
    readonly name: string,
    readonly coverImageUrl: string,
    readonly description: string,
    readonly timestampA: number,
    readonly timestampB: number,
    readonly publisherOrganizationId: string,
    readonly developerOrganizationIds: string[],
    readonly languages: string[],
    readonly countries: string[],
    readonly internalName: string,
  ) {
    super();
  }

  static fromProto(proto: Array<JsProto>): Sku {
    const typeId = proto[6] as keyof typeof skuTypeIds;
    const type = skuTypeIds[typeId] || `-unknown-type-${typeId}`;
    const skuId = proto[0] as string;
    const gameId = (proto[4] ?? undefined) as string | undefined;
    const name = proto[1] as string;
    const description = proto[9] as string;
    const languages = proto[24] as string[];
    const countries = proto[25] as string[];

    const coverImageUrl = (proto as any)[2][1][0][0][1]?.split(
      /=/,
    )[0] as string;
    const timestampA = (proto as any)[10][0] as number;
    const timestampB = (proto as any)[26][0] as number;

    const publisherOrganizationId = proto[15] as string;
    const developerOrganizationIds = proto[16] as string[];

    const internalName = proto[5] as string;

    return new Sku(
      typeId,
      type,
      skuId,
      gameId,
      name,
      coverImageUrl,
      description,
      timestampA,
      timestampB,
      publisherOrganizationId,
      developerOrganizationIds,
      languages,
      countries,
      internalName,
    );
  }
}
