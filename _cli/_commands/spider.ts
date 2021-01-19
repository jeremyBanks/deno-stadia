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

export const command = async (_: Client, flags: FlagArgs) => {
};
