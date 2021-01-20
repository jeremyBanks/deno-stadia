import { FlagArgs, FlagOpts } from "../../deps.ts";
import { StadiaDatabase } from "../../stadia/database.ts";
import { eprintln } from "../../_common/io.ts";

export const flags: FlagOpts = {
  string: "sqlite",
  default: {
    sqlite: "./spider.sqlite",
  },
};

export const command = async (_: unknown, flags: FlagArgs) => {
  const database = new StadiaDatabase(flags.sqlite);

  for (const row of database.tables.Player.zodTable.select()) {
    console.log(row);
  }

  return await (null as unknown);
};
