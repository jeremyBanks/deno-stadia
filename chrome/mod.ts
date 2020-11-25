import { log, SQL } from "../deps.ts";
import { assert } from "../_common/assertions.ts";

import { aesGcm256DecryptAndVerifyAsUtf8 } from "./crypto.ts";
import { cryptUnprotectData } from "./windows.ts";

class ChromeProfile {
  readonly path: string;
  readonly encryptionKey: Uint8Array;

  readonly name: string;
  readonly label: string;

  readonly lastActiveTimestamp: number;

  readonly googleId?: string;
  readonly googleName?: string;
  readonly googleEmail?: string;
  readonly googleAvatarUrl?: string;
  readonly googleOrganization?: string;

  // deno-lint-ignore no-explicit-any
  constructor(opts: ChromeProfile | any) {
    this.path = opts.path;
    this.encryptionKey = opts.encryptionKey;
    this.name = opts.name;
    this.label = opts.label;
    this.lastActiveTimestamp = opts.lastActiveTimestamp || 0;
    this.googleId = opts.googleId || undefined;
    this.googleName = opts.googleName || undefined;
    this.googleEmail = opts.googleEmail || undefined;
    this.googleAvatarUrl = opts.googleAvatarUrl || undefined;
    this.googleOrganization = opts.googleOrganization || undefined;
    assert(typeof this.path === "string");
    assert(this.encryptionKey instanceof Uint8Array);
    assert(typeof this.name === "string");
    assert(typeof this.label === "string");
    assert(
      typeof this.lastActiveTimestamp === "number" ||
        this.lastActiveTimestamp === undefined,
    );
    assert(
      typeof this.googleId === "string" ||
        this.googleId === undefined,
    );
    assert(
      typeof this.googleName === "string" ||
        this.googleName === undefined,
    );
    assert(
      typeof this.googleEmail === "string" ||
        this.googleEmail === undefined,
    );
    assert(
      typeof this.googleAvatarUrl === "string" ||
        this.googleAvatarUrl === undefined,
    );
    assert(
      typeof this.googleOrganization === "string" ||
        this.googleOrganization === undefined,
    );
  }

  decryptAndDecode(encryptedValue: Uint8Array): string {
    return aesGcm256DecryptAndVerifyAsUtf8(
      this.encryptionKey,
      encryptedValue.slice(3, 15),
      encryptedValue.slice(15),
    );
  }

  // Returns an Array containing every cookie set in this Chrome profile.
  // Excludes cookies set in old versions of code using different encryption.
  async cookies(): Promise<
    Array<{
      host: string;
      name: string;
      path: string;
      value: string;
      creationTimestamp: number;
      expiresTimestamp: number;
      lastAccessTimestamp: number;
      isSecure: boolean;
      isHttponly: boolean;
    }>
  > {
    // TODO: open database read-only (not currently possible)
    return (await SQL(`${this.path}/Cookies`)(SQL`
      SELECT *, encrypted_value
      from cookies
      order by last_access_utc desc, creation_utc desc, expires_utc desc, host_key desc
    `)).filter(({ encrypted_value }) =>
      (encrypted_value as unknown as Uint8Array).slice(0, 3).toString() ===
        "118,49,48"
      // deno-lint-ignore no-explicit-any
    ).map((row: any) => ({
      host: row.host_key,
      name: row.name,
      path: row.path,
      value: this.decryptAndDecode(row.encrypted_value),
      creationTimestamp: Number(row.creation_utc),
      expiresTimestamp: Number(row.expires_utc),
      lastAccessTimestamp: Number(row.last_access_utc),
      isSecure: row.is_secure === 1,
      isHttponly: row.is_httponly === 1,
    }));
  }

  toString() {
    return `ChromeProfile { label: ${JSON.stringify(this.name)}, googleEmail: ${
      JSON.stringify(this.googleEmail)
    }, ... }`;
  }
}

// Discovers all readable Chrome profiles.
export const discoverProfiles = async (): Promise<Array<ChromeProfile>> => {
  const discoveredProfiles: Array<ChromeProfile> = [];

  // We can't tell which Windows user we are if we're running inside WSL, so
  // we'll just try to read every Chrome profile for every Windows user.
  // Filesystem and DPAPI errors will to tell us which profiles to exclude.
  const systemUserRoots = [
    "/mnt/c/Users",
    "//?/c:/Users",
  ];

  for (const systemUserRoot of systemUserRoots) {
    let systemUsers;
    try {
      systemUsers = [...Deno.readDirSync(systemUserRoot)].filter((
        { isDirectory },
      ) => isDirectory).map(({ name }) => name);
    } catch (error) {
      if (error instanceof Deno.errors.PermissionDenied) {
        log.warning(`Unable to list contents of ${systemUserRoot}: ${error}`);
      } else {
        log.debug(`Unable to list contents of ${systemUserRoot}: ${error}`);
      }
      continue;
    }

    for (const user of systemUsers) {
      const profileRoot =
        `${systemUserRoot}/${user}/AppData/Local/Google/Chrome/User Data`;
      const localStatePath = `${profileRoot}/Local State`;

      let encryptedEncryptionKey;
      let profiles;
      try {
        const state = JSON.parse(
          await Deno.readTextFile(localStatePath),
        );
        profiles = state?.["profile"]?.["info_cache"];
        assert(profiles instanceof Object, "profile cache missing");
        encryptedEncryptionKey = state?.["os_crypt"]?.["encrypted_key"];
        assert(
          typeof encryptedEncryptionKey === "string",
          "encryption key missing",
        );
      } catch (error) {
        log.debug(
          `Unable to read Chrome profiles for system user ${user} at ${localStatePath}: ${error}`,
        );
        continue;
      }

      let encryptionKey;
      try {
        const keyCiphertext = new Uint8Array(
          [...atob(encryptedEncryptionKey).slice(5)].map((c) =>
            c.codePointAt(0)!
          ),
        );
        encryptionKey = await cryptUnprotectData(keyCiphertext);
      } catch (error) {
        if (error instanceof Deno.errors.PermissionDenied) {
          log.warning(
            `Unable to decrypt Chrome cookie encryption key: ${error}`,
          );
        } else {
          log.info(`Unable to decrypt Chrome cookie encryption key: ${error}`);
        }
        continue;
      }

      for (
        const [name, meta] of Object.entries(
          profiles,
          // deno-lint-ignore no-explicit-any
        ) as any
      ) {
        const profilePath = `${profileRoot}/${name}`;

        try {
          assert(Deno.statSync(profilePath).isDirectory);
          assert(Deno.statSync(`${profilePath}/Cookies`).isFile);
          assert(Deno.statSync(`${profilePath}/History`).isFile);
          assert(Deno.statSync(`${profilePath}/Bookmarks`).isFile);
          assert(Deno.statSync(`${profilePath}/Favicons`).isFile);
          assert(Deno.statSync(`${profilePath}/Accounts`).isDirectory);
        } catch (error) {
          log.warning(
            `Chrome profile directory ${profilePath} had unexpected structure: ${error}`,
          );
          continue;
        }

        discoveredProfiles.push(
          new ChromeProfile({
            path: profilePath,
            encryptionKey,

            name: meta["name"],
            label: meta["shortcut_name"],

            lastActiveTimestamp: meta["active_time"] || 0,

            googleId: meta["gaia_id"],
            googleName: meta["gaia_name"],
            googleEmail: meta["user_name"],
            googleAvatarUrl: meta["last_downloaded_gaia_picture_url_with_size"],
            googleOrganization: meta["hosted_domain"],
          }),
        );
      }
    }
  }

  return discoveredProfiles;
};
