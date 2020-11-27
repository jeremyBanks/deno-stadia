import { discoverProfiles } from "../chrome/mod.ts";
import { Database, flags, log } from "../deps.ts";
import * as clui from "../_common/clui.ts";
import { GoogleCookies } from "../stadia/web_client/requests.ts";
import { Client } from "../stadia/web_client/views.ts";
import { notImplemented } from "../_common/assertions.ts";

export const makeClient = async (flags: flags.Args): Promise<Client> => {
  const database = new Database("./deno-stadia.sqlite");
  if (flags.offline) {
    return new Client("", GoogleCookies.fromString(""), database);
  } else if (flags['google-cookie']) {
    return new Client(
      "",
      GoogleCookies.fromString(flags['google-cookie']),
      database,
    );
  } else {
    const targetEmail = flags["google-email"];

    const chromeProfiles = await discoverProfiles();
    log.debug(`Discovered ${chromeProfiles.length} Chrome profiles.`);

    const googleAccounts = [];

    for (const chromeProfile of chromeProfiles) {
      const { googleId, googleEmail } = chromeProfile;

      if (!googleId || !googleEmail) {
        log.debug(
          `${chromeProfile} is not synced with a Google account.`,
        );
        continue;
      }

      const cookies = await chromeProfile.cookies();

      const googleCookiesRecord = Object.fromEntries(
        cookies.filter((c) => c.host === ".google.com").flatMap((c) =>
          ["SID", "SSID", "HSID"].includes(c.name) ? [[c.name, c.value]] : []
        ),
      );

      if (Object.keys(googleCookiesRecord).length < 3) {
        log.debug(
          `${chromeProfile} does not have Google authentication cookies.`,
        );
        continue;
      }

      if (targetEmail && targetEmail !== googleEmail) {
        log.debug(
          `${chromeProfile} does not match target email address (${targetEmail}).`,
        );
        continue;
      }

      const googleCookies = new GoogleCookies(
        googleCookiesRecord["SID"],
        googleCookiesRecord["SSID"],
        googleCookiesRecord["HSID"],
      );

      googleAccounts.push({
        googleId,
        googleEmail,
        googleCookies,
        chromeProfile,
      });
    }

    const choices = googleAccounts.map((profile) => ({
      profile,
      toString() {
        return [
          profile.chromeProfile.name,
          `<${profile.chromeProfile.googleEmail}>`,
        ].join(" ");
      },
    }));

    const profile = (await clui.choose(choices, choices[0])).profile;

    log.info(`Using ${profile.chromeProfile}`);

    return new Client(profile.googleId!, profile.googleCookies, database);
  }
};
