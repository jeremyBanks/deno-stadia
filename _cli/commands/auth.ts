import { Client } from "../../stadia/web_client/mod.ts";
import { println } from "../../_common/io.ts";
import { color } from "../../deps.ts";

export const flags = {};

export const command = async (client: Client) => {
  const view = (await client.fetchView("/profile"));

  const { userGoogleId, userGoogleEmail, userPlayer } = view.page;

  let gamerTagPretty;
  if (userPlayer.gamerNumber === "0000") {
    gamerTagPretty = `${color.bold(userPlayer.gamerName)} ✨`;
  } else {
    gamerTagPretty = `${color.bold(userPlayer.gamerName)}${
      color.dim(`#${userPlayer.gamerNumber}`)
    }`;
  }

  println();
  println(`  ${google}  email:  ${color.bold(String(userGoogleEmail))}`);
  println(`               id:  ${userGoogleId}`);
  println();
  println(`  ${stadia}   name:  ${gamerTagPretty}`);
  println(`               id:  ${userPlayer.gamerId}`);
  println();
};

const google = color.bold(color.bgRgb24(
  [
    " ",
    color.rgb24("G", 0x4286f3),
    color.rgb24("o", 0xea4333),
    color.rgb24("o", 0xfbbe04),
    color.rgb24("g", 0x4286f3),
    color.rgb24("l", 0x33a951),
    color.rgb24("e", 0xea4333),
    " ",
  ].join(""),
  0xFFFFFF,
));

const stadia = color.bold(color.bgRgb24(
  [
    " ",
    color.rgb24("S", 0xff4c1d),
    color.rgb24("t", 0xf74622),
    color.rgb24("a", 0xe5382f),
    color.rgb24("d", 0xd32b3c),
    color.rgb24("i", 0xc01c49),
    color.rgb24("a", 0x9b0063),
    " ",
  ].join(""),
  0x000000,
));
