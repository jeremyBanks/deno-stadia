import { FlagArgs, FlagOpts } from "../../deps.ts";
import { StadiaDatabase } from "../../stadia/database.ts";
import { z } from "../../deps.ts";
import { as, assertStatic } from "../../_common/utility_types/mod.ts";
import { eprintln } from "../../_common/io.ts";
import { PlayerId } from "../../stadia/common_scalars.ts";

export const flags: FlagOpts = {
  string: "sqlite",
  default: {
    sqlite: "./spider.sqlite",
  },
};

export const command = async (_: unknown, flags: FlagArgs) => {
  const database = new StadiaDatabase(flags.sqlite);

  const { Player } = database.database;

  for (const player of Player.select()) {
    console.log(player.value);
  }

  return await (null as unknown);
};
