import { Client } from "../../stadia/client.ts";
import { eprintln, print, println } from "../../_common/io.ts";
import { color, FlagArgs, FlagOpts, log, sqlite, z } from "../../deps.ts";
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

  seed(model: models.Model) {
    const key = this.keyOf(model);
    if (!this.has(key)) {
      this.set(key, {
        model,
        lastFetchAttempted: null,
        lastFetchCompleted: null,
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
    await this.seed();

    for (
      const model of [...this.db.values()]
        .sort((a, b, order = ["sku", "game", "player"]) =>
          order.indexOf(a.model.type) - order.indexOf(b.model.type)
        )
        .sort((a, b) =>
          (a.lastFetchCompleted ?? 0) - (b.lastFetchCompleted ?? 0)
        )
        .sort((a, b) =>
          (a.lastFetchAttempted ?? 0) - (b.lastFetchAttempted ?? 0)
        )
    ) {
      await this.update(model);
      console.log(model);
    }

    return this;
  }

  async update(remote: RemoteModel) {
    remote.lastFetchAttempted = Date.now();

    if (remote.model.type === "game") {
      log.warning(
        `update() not implemented for ${remote.model.type}, skipping...`,
      );
      return;
    } else if (remote.model.type === "player") {
      log.warning(
        `update() not implemented for ${remote.model.type}, skipping...`,
      );
      return;
    } else if (remote.model.type === "sku") {
      const updated = await this.client.fetchSku(
        remote.model.skuId,
        remote.model.gameId ?? undefined,
      );
      for (const [key, value] of Object.entries(updated)) {
        if (value != null) {
          (remote.model as any)[key] = value;
        }
      }
    } else {
      return unreachable();
    }

    remote.lastFetchCompleted = Date.now();
    this.db.upsert(remote);
  }

  async seed() {
    for (
      const playerId of [
        "5904879799764",
        "3336291440735869496",
        "4028567364230127809",
        "11077485192842304995",
        "11986016002911569133",
        "13541093767486303504",
        "16012539233881992441",
      ]
    ) {
      this.db.seed({
        playerId,
        type: "player",
        name: null,
        number: null,
        playedGameIds: null,
        friendPlayerIds: null,
        proto: null,
      });
    }

    for (const { skuId, gameId } of await this.client.fetchStoreList(3)) {
      this.db.seed({
        gameId: expect(gameId),
        type: "game",
        name: null,
        proto: null,
      });
      this.db.seed({
        skuId,
        type: "sku",
        skuType: null,
        gameId: null,
        name: null,
        description: null,
        internalName: null,
        proto: null,
      });
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
      ]
    ) {
      this.db.seed({
        skuId,
        type: "sku",
        skuType: null,
        gameId: null,
        name: null,
        description: null,
        internalName: null,
        proto: null,
      });
    }

    log.info(`now ${this.db.size} entries`);
    console.log([...this.db.entries()]);
  }
}
