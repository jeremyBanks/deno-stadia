import { discoverProfiles } from "../_chrome/mod.ts";
import { flags, log, z } from "../_deps.ts";
import * as clui from "../_common/clui.ts";
import { Client, GoogleCookies } from "../stadia.ts";

export const makeClient = async (
  flags: flags.Args,
  skipSeeding: boolean,
): Promise<Client> => {
  let env;
  try {
    env = Deno.env.toObject();
  } catch {
    env = {};
  }

  flags.offline ??= env["DENO_STADIA_OFFLINE"];
  flags["google-cookie"] ??= env["DENO_STADIA_GOOGLE_COOKIE"];
  flags["google-email"] ??= env["DENO_STADIA_GOOGLE_EMAIL"];

  const sqlitePath = z.string().optional().parse(flags["sqlite"]);

  if (flags.offline) {
    return new Client(
      "",
      GoogleCookies.fromString(""),
      sqlitePath,
      skipSeeding,
    );
  } else if (flags["google-cookie"]) {
    return new Client(
      "",
      GoogleCookies.fromString(flags["google-cookie"]),
      sqlitePath,
      skipSeeding,
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
        continue;
      }

      if (targetEmail && targetEmail !== googleEmail) {
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

    return new Client(
      profile.googleId!,
      profile.googleCookies,
      sqlitePath,
      skipSeeding,
    );
  }
};
