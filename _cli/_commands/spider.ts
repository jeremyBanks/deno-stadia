import { FlagArgs, FlagOpts } from "../../deps.ts";
import { StadiaDatabase } from "../../stadia/database.ts";
import { eprintln } from "../../_common/io.ts";

export const flags: FlagOpts = {
  string: "sqlite",
  default: {
    sqlite: "./spider.sqlite",
  },
};

export const command = (_: unknown, flags: FlagArgs) => {
  const database = new StadiaDatabase(flags.sqlite);

  database.tables.Player.table;
};
