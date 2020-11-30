import { Client } from "../../stadia/web_client/mod.ts";
import { eprintln, print, println } from "../../_common/io.ts";
import { color, FlagArgs, FlagOpts } from "../../deps.ts";
import * as json from "../../_common/json.ts";

// this is a huge import, so we put it here instead of ./deps since it's not
// required for the library, only this command.
import Canvas, * as canvas from 'https://deno.land/x/canvas@v1.0.4/mod.ts'
import { throttled } from "../../_common/async.ts";

export const flags: FlagOpts = {};

const loadImage = throttled(2.4, canvas.loadImage);

export const command = async (client: Client, flags: FlagArgs) => {
  const listPage = await client.fetchStoreList();

  const games = await Promise.all(listPage.skus.filter(x => x.type === 'game').map(async game => {

    const image = await loadImage(game.coverImageUrl);
    const microThumbnail = Canvas.MakeCanvas(8, 8);
    microThumbnail.getContext('2d')!.drawImage(image, 0, 0, 8, 8);

    console.log(microThumbnail.toDataURL());

    Deno.exit(0);
  }));

  console.log(games);
};
