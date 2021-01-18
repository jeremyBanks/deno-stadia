import { Client } from "../../stadia/client.ts";
import { FlagArgs, FlagOpts, z } from "../../deps.ts";
import zoddb, { ColumnDefinitions } from "../../_common/zoddb.ts";
import { NoInfer } from "../../_common/utility_types/mod.ts";
import bigrams from "../../_common/bigrams.ts";
import { notImplemented } from "../../_common/assertions.ts";
import { Proto, ProtoMessage } from "../../_common/proto.ts";

export const flags: FlagOpts = {
  string: "sqlite",
  default: {
    sqlite: "./spider.sqlite",
  },
};

type Unbox<T extends z.ZodType<any, z.ZodTypeDef, any>> = NoInfer<
  z.infer<NoInfer<T>>
>;

export const command = async (_: Client, flags: FlagArgs) => {
  const db = openDB(flags.sqlite);
  const { Player } = db;
  type Player = z.infer<typeof Player["type"]>;

  console.log(`There are ${Player.count()} Players.`);

  Player.insert({
    playerId: "134",
    request: Player.remoteModel.makeRequest("134"),
  });

  console.log(`There are ${Player.count()} Players.`);

  console.log(Player.get());
};

export class StadiaClient {
  constructor(
    readonly database: StadiaDatabase,
  ) {}
}

export class StadiaDatabase {
  constructor(
    private path: string,
  ) {}

  // private readonly stadiaTableDefinitions = readonly;
  db = zoddb.open(this.path, {});
}
