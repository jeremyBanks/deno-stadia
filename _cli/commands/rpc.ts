import { Client } from "../../stadia/client.ts";
import { eprintln, print, println } from "../../_common/io.ts";
import { color, FlagArgs, FlagOpts, log } from "../../deps.ts";
import * as json from "../../_common/json.ts";
import { Proto } from "../../stadia/protos.ts";

export const flags: FlagOpts = {
  boolean: ["json"],
};

export const command = async (client: Client, flags: FlagArgs) => {
  const args = flags["_"] as Array<string>;
  if (args.length < 1) {
    eprintln(color.red("rpcId required"));
    Deno.exit(70);
  }

  const [rpcId, ...rpcArgsJson] = args;
  const rpcArgs = rpcArgsJson.map((s) => {
    try {
      return json.decode(s) as Proto;
    } catch (error) {
      log.warning(error);
      return s;
    }
  });
  const response = await client.fetchRpc(rpcId, rpcArgs);

  const data = response.data;

  if (flags.json) {
    println(json.encode(data));
  } else {
    println(Deno.inspect(data, {
      depth: 6,
      iterableLimit: 24,
      sorted: true,
    }));
  }
};
