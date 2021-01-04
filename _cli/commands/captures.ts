import { Client } from "../../stadia/client.ts";
import { log, z } from "../../deps.ts";
import { eprint, eprintln, print, println } from "../../_common/io.ts";
import { color, FlagArgs, FlagOpts } from "../../deps.ts";
import * as json from "../../_common/json.ts";
import { sleep } from "../../_common/async.ts";

export const flags: FlagOpts = {};

export const command = async (client: Client, flags: FlagArgs) => {
  for await (const capture of client.fetchCaptures()) {
    const name = slugify(`${capture.timestamp}-${capture.gameName}`);
    let url;
    let filename;
    if (capture.videoUrl) {
      url = capture.videoUrl;
      filename = `${name}.webm`;
    } else {
      url = capture.imageUrl!;
      filename = `${name}.jpg`;
    }

    const response = await client.fetchHttp(url);

    const body = await response.httpResponse.arrayBuffer();

    await Deno.writeFile(filename, new Uint8Array(body));

    log.info(`Saved ${filename}`);
  }
};

export const slugify = (name: string, separator = "-") =>
  name
    .replace(/é/g, "e")
    .normalize("NFKD")
    .replace(/[\u0300-\u0362]/g, "")
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^[\- :]+)|([\- :]+$)/g, "")
    .replace(/\-/g, separator);
