import { Client } from "../../stadia/client.ts";
import { eprintln, print, println } from "../../_common/io.ts";
import {
  BufReader,
  color,
  FlagArgs,
  FlagOpts,
  log,
  readLines,
  sqlite,
  z,
} from "../../deps.ts";
import * as json from "../../_common/json.ts";
import { Json } from "../../_common/json.ts";
import { Proto } from "../../stadia/protos.ts";
import * as protos from "../../stadia/protos.ts";
import * as models from "../../stadia/models.ts";
import {
  assert,
  expect,
  notImplemented,
  unreachable,
} from "../../_common/assertions.ts";
import {
  DefaultKey,
  DefaultValue,
  ZodSqliteMap,
} from "../../_common/zodmap.ts";
import { Arguments } from "../../_common/utility_types/mod.ts";
import { flatMap } from "../../_common/iterators.ts";
import { sleep } from "../../_common/async.ts";

export const flags: FlagOpts = {
  string: "sqlite",
  default: {
    sqlite: "./stadia.sqlite",
  },
};

const RemoteModel = z.object({
  model: models.Model,
  lastFetchAttempted: z.number().positive().nullable(),
  lastFetchCompleted: z.number().positive().nullable(),
});
type RemoteModel = z.infer<typeof RemoteModel>;
class ModelDB extends ZodSqliteMap<typeof DefaultKey, typeof RemoteModel> {
  constructor(path: string) {
    super(path, DefaultKey, RemoteModel);
  }

  protected keyOf(model: models.Model): DefaultKey {
    if (model.type === "game") {
      return model.gameId;
    } else if (model.type === "sku") {
      return model.skuId;
    } else if (model.type === "player") {
      return model.playerId;
    } else {
      return unreachable(`unexpected model.type: ${model["type"]}`);
    }
  }

  upsert(model: RemoteModel): this {
    const key = this.keyOf(model.model);
    return this.set(key, model);
  }

  find(model: RemoteModel): RemoteModel | undefined {
    const key = this.keyOf(model.model);
    return this.get(key);
  }

  seed(type: models.Model["type"], key: DefaultKey): boolean {
    if (!this.has(key)) {
      this.set(key, {
        lastFetchAttempted: null,
        lastFetchCompleted: null,
        model: {
          proto: null,
          ...(
            (type === "game")
              ? {
                type,
                gameId: key,
                skuId: null,
                name: null,
              }
              : (type === "player")
              ? {
                type,
                playerId: key,
                name: null,
                number: null,
              }
              : (type === "sku")
              ? {
                type,
                skuId: key,
                skuType: null,
                gameId: null,
                name: null,
                description: null,
                internalName: null,
                timestampA: null,
                timestampB: null,
                coverImageUrl: null,
                publisherOrganizationId: null,
                developerOrganizationIds: null,
              }
              : unreachable()
          ),
        },
      });
      return true;
    } else {
      return false;
    }
  }
}

export const command = async (client: Client, flags: FlagArgs) =>
  (new Command(client, flags)).run();

class Command {
  constructor(
    readonly client: Client,
    readonly flags: FlagArgs,
    readonly db = new ModelDB(flags.sqlite),
  ) {}

  async run(): Promise<this> {
    const backupPath = `${this.flags.sqlite}.bak`;

    await Deno.truncate(backupPath).catch(() => {});
    this.db.db.query("VACUUM INTO ?", [backupPath]);

    log.debug("Loading seed data");
    this.db.db.query("savepoint seed");
    await this.seed();
    this.db.db.query("release seed");

    let i = 0;
    const instances = [...flatMap(this.db.valuesUnchecked(), (record) => {
      return [[i++, record]] as Array<[number, typeof record]>;
    })].sort(([a_i, a], [b_i, b]) =>
      ((a.model.type !== b.model.type)
        ? (
          (a.model.type === "game") ? -1 : (b.model.type === "game") ? +1 : null
        )
        : null) ?? (
          ((a.lastFetchAttempted ?? 0) < (b.lastFetchAttempted ?? 0))
            ? -1
            : ((a.lastFetchAttempted ?? 0) > (b.lastFetchAttempted ?? 0))
            ? +1
            : ((a.lastFetchCompleted ?? 0) < (b.lastFetchCompleted ?? 0))
            ? -1
            : ((a.lastFetchCompleted ?? 0) > (b.lastFetchCompleted ?? 0))
            ? +1
            : -(a_i - b_i)
        )
    ).map(([_, x]) => x);

    log.info(`${instances.length} instances to spider.`);

    for (const model of instances) {
      log.debug(`Updating: ${
        Deno.inspect(model, {
          depth: 2,
          iterableLimit: 8,
        })
      }`);
      try {
        await this.update(model);
      } catch (error) {
        log.error(
          `failed to update ${model?.model
            ?.type} due to ${error}\n${error.stack}`,
        );
        await sleep(1);
        continue;
      }
    }

    return this;
  }

  async update(remote: RemoteModel) {
    remote.lastFetchAttempted = Date.now();
    this.db.upsert(remote);

    if (remote.model.type === "player") {
      const { playerId } = remote.model;
      const { player, friends, playedGames, gameStats } = await this.client
        .fetchPlayer(
          remote.model.playerId,
        );

      log.debug(Deno.inspect({ player, friends, playedGames }));

      remote.model = player;

      if (friends?.friendPlayerIds?.length) {
        const friendsKey = `${playerId}.friends`;
        this.db.set(friendsKey, {
          lastFetchAttempted: null,
          ...(this.db.get(friendsKey)?.model ?? {}),
          model: friends,
          lastFetchCompleted: Date.now(),
        });
        for (const friendPlayerId of friends.friendPlayerIds ?? []) {
          if (this.db.seed("player", friendPlayerId)) {
            log.debug(
              `discovered new player ${friendPlayerId} as friend of ${remote.model.playerId}`,
            );
          }
        }
      }

      if (playedGames?.playedGameIds?.length) {
        const gamesKey = `${remote.model.playerId}.games`;
        this.db.set(gamesKey, {
          lastFetchAttempted: null,
          ...(this.db.get(gamesKey)?.model ?? {}),
          model: playedGames!,
          lastFetchCompleted: Date.now(),
        });
        for (const playedGameId of playedGames.playedGameIds ?? []) {
          if (this.db.seed("game", playedGameId)) {
            log.warning(
              `discovered new game ${playedGameId} played by ${remote.model.playerId}`,
            );
          }
        }
      }

      if (playedGames?.playedGameIds?.length && gameStats?.proto) {
        const statsKey = `${remote.model.playerId}.gamestats`;
        this.db.set(statsKey, {
          lastFetchAttempted: null,
          ...(this.db.get(statsKey)?.model ?? {}),
          model: gameStats!,
          lastFetchCompleted: Date.now(),
        });
      }
    } else if (remote.model.type === "sku") {
      const updated = await this.client.fetchSku(
        remote.model.skuId,
      );
      remote.model = updated;
    } else if (remote.model.type === "game") {
      for (const sku of await this.client.fetchGame(remote.model.gameId)) {
        this.db.set(sku.skuId, {
          lastFetchAttempted: null,
          ...(this.db.get(sku.skuId)?.model ?? {}),
          model: sku,
          lastFetchCompleted: Date.now(),
        });
        if (sku.skuType === "game") {
          remote.model.name = sku.name;
          remote.model.proto = sku.proto;
          remote.model.skuId = sku.skuId;
        }
      }
    } else {
      log.warning(`spidering not yet implemented for ${remote.model.type}`);
      await sleep(3.5);
      return;
    }

    remote.lastFetchCompleted = Date.now();
    this.db.upsert(remote);
  }

  async seed() {
    const playerIds = [
      "5904879799764",
      "3336291440735869496",
      "4028567364230127809",
      "11077485192842304995",
      "11986016002911569133",
      "13541093767486303504",
      "16012539233881992441",
    ];
    for (
      const playerId of playerIds
    ) {
      this.db.seed("player", playerId);
    }

    // the "All Games" list includes all listed game skus and some bundles
    for (const { skuId, gameId } of await this.client.fetchStoreList(3)) {
      this.db.seed("game", expect(gameId));
      this.db.seed("sku", skuId);
    }

    for (
      // some delisted/unlisted skus that haven't been deleted
      const skuId of [
        "59c8314ac82a456ba61d08988b15b550",
        "dfcc2a3f9ab0421c86ba27e35ff8e41a",
        "69f80c302be14b8284ba84d1229848e8",
        "32a0791a88474f08ad7a687846b786f2",
        "ee008ea2de714bdb811694c75a023d0f",
        "2e51be1b06974b81bcf0b4767b4c63dfp",
        "2f112e5ba3d544d69bb1d537c5c4ae5c",
        "5ce9f4c1253047dda226a982fc3dc866",
        "6ed658c7e6564de6acf724f979172bb6p",
      ]
    ) {
      this.db.seed("sku", skuId);
    }

    log.info(`now ${this.db.size} entries`);
  }
}
