import { Client } from "../../stadia/web_client/views.ts";
import { notImplemented } from "../../_common/assertions.ts";

export const flags = {};

export const command = async (client: Client) => {
  console.log(await client.fetchView("/profile"));

  notImplemented();
};
