import { Client } from "../../stadia/client.ts";
import { eprintln, print, println } from "../../_common/io.ts";
import { color, FlagArgs, FlagOpts } from "../../deps.ts";
import * as json from "../../_common/json.ts";
import { Proto } from "../../stadia/protos.ts";

export const flags: FlagOpts = {
  boolean: [],
};

export const command = async (client: Client, flags: FlagArgs) => {
  const args = flags["_"] as Array<string>;
  if (args.length < 1) {
    eprintln(color.red("rpcId required"));
    Deno.exit(70);
  }

  const [rpcId, ...rpcArgsJson] = args;
  const rpcArgs = rpcArgsJson.map((s) => json.decode(s) as Proto);
  const response = await client.fetchRpc(rpcId, rpcArgs);

  println(Deno.inspect(response.data, {
    depth: 6,
    iterableLimit: 12,
    sorted: true,
  }));
};
