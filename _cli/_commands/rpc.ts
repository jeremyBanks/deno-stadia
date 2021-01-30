import { Client } from "../../stadia.ts";
import { eprintln, print, println } from "../../_common/io.ts";
import { color, FlagArgs, FlagOpts, log } from "../../_deps.ts";
import * as json from "../../_common/json.ts";
import { ProtoMessage } from "../../_common/proto.ts";

// deno-lint-ignore-file no-explicit-any

export const flags: FlagOpts = {
  boolean: ["json"],
};

export const command = async (client: Client, flags: FlagArgs) => {
  const args = flags["_"] as Array<string>;

  const pairs: Array<[string, ProtoMessage]> = [];

  for (const arg of args) {
    const [rpcId] = arg.split(/\b/, 1);
    let rpcArgsJson = arg.slice(rpcId.length).trim();
    if (rpcArgsJson.startsWith("(") && rpcArgsJson.endsWith(")")) {
      rpcArgsJson = `[${rpcArgsJson.slice(1, -1)}]`;
    }

    const rpcArgs = ProtoMessage.parse(json.decode(rpcArgsJson));
    pairs.push([rpcId, rpcArgs]);
  }

  const { responses } = await client.fetchRpcBatch(pairs);

  for (const [i, [rpcId, rpcArgs]] of pairs.entries()) {
    const response = responses[i];
    log.info(`request: ${rpcId}${json.encode(rpcArgs, 2)}`);
    if (flags.json) {
      println(json.encode(response, 2));
    } else {
      println(Deno.inspect(response, {
        depth: 6,
        iterableLimit: 24,
        sorted: true,
      }));
    }
  }
};
