import { Client } from "../../stadia/web_client/views.ts";
import { println } from "../../_common/io.ts";
import { color } from "../../deps.ts";

const { rgb24, bold, underline } = color;

export const flags = {};

const google = bold([
  rgb24("G", 0x156aeb),
  rgb24("o", 0xd6412d),
  rgb24("o", 0xffbc09),
  rgb24("g", 0x156aeb),
  rgb24("l", 0x009752),
  rgb24("e", 0xd6412d),
].join(""));

const stadia = [
  bold(rgb24("S", 0xff4c1d)),
  bold(rgb24("t", 0xf74622)),
  bold(rgb24("a", 0xe5382f)),
  bold(rgb24("d", 0xd32b3c)),
  bold(rgb24("i", 0xc01c49)),
  bold(rgb24("a", 0x9b0063)),
].join("");

export const command = async (client: Client) => {
  const view = (await client.fetchView("/profile"));

  const { googleId, googleEmail, gamerId, gamerTag } = view.view;

  println();
  println(`  ${google} email:   ${googleEmail}`);
  println(`         id:      ${googleId}`);
  println();
  println(`  ${stadia} name:    ${gamerTag}`);
  println(`         id:      ${gamerId}`);
  println(
    `         profile: ${
      underline(`https://stadia.google.com/profile/${gamerId}`)
    }`,
  );
  println();
};
