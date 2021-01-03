import { Client } from "../../stadia/web_client/mod.ts";
import { eprintln, print, println } from "../../_common/io.ts";
import { color, FlagArgs, FlagOpts } from "../../deps.ts";
import * as json from "../../_common/json.ts";

export const flags: FlagOpts = {};

export const command = async (client: Client, flags: FlagArgs) => {
  for await (const capture of client.fetchCaptures()) {
    if (capture.imageUrl) {
      console.log(`SCREENSHOT: ${capture.imageUrl}`);
    } else {
      console.log(`VIDEO CLIP: ${capture.videoUrl}`);
    }
  }
};
