import { Client } from "../../stadia/client.ts";
import { eprintln, print, println } from "../../_common/io.ts";
import { color, FlagArgs, FlagOpts } from "../../deps.ts";
import * as json from "../../_common/json.ts";

export const flags: FlagOpts = {
  boolean: ["json"],
};

export const command = async (client: Client, flags: FlagArgs) => {
  const urls = flags["_"].map(String);
  if (urls.length === 0) {
    eprintln(color.red("expected a stadia_url but none were provided"));
    Deno.exit(70);
  }
  for (const url of urls) {
    eprintln(`${color.underline(url)}`);

    const result = (await client.fetchPage(url));
    const { request, response } = result;

    if (flags.json) {
      println(json.encode({ request, response }));
      return;
    }

    println(Deno.inspect(response));
    eprintln();
  }
};
