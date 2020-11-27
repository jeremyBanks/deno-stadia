import { Client } from "../../stadia/web_client/views.ts";
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
    const result = (await client.fetchView(url));
    const { request, response, view } = result;

    if (flags.json) {
      println(json.encode({ request, response, view }));
      return;
    }

    print(json.encode(result.view));
  }
};
