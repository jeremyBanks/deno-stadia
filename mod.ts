#!/usr/bin/env -S deno run --allow-read --allow-write
import SQL from "https://deno.land/x/lite@0.0.9/sql.ts";
import * as log from "https://deno.land/std@0.75.0/log/mod.ts";

const chromeState = await Deno.readTextFile("/mnt/c/Users/_/AppData/Local/Google/Chrome/User Data/Local State").then(JSON.parse);

const chromeProfiles = Object.entries(chromeState.profile.info_cache).filter((
  x: any,
) => x[1] && x[1].gaia_id)
  .sort((a: any, b: any) => b[1].active_time - a[1].active_time).map((
    [key, x]: any,
  ) => ({
    key,
    label: [...new Set([x.gaia_name, x.name, `<${x.user_name}>`])].join(
      " ",
    ),
    google_id: x.gaia_id as string,
  }));

// AES-256-GCM key used for local data that is encrypted at rest.
const chromeKey = chromeState.os_crypt.encrypted_key as string;

for (const profile of chromeProfiles) {
  const db = SQL(
    `/mnt/c/Users/_/AppData/Local/Google/Chrome/User Data/${profile.key}/Cookies`,
  );

  const lastAccessedStadia = (await db(
    SQL
      `SELECT last_access_utc from cookies where host_key = '.stadia.google.com' order by last_access_utc desc limit 0, 1`,
  ))[0]?.last_access_utc as bigint;

  if (lastAccessedStadia) {
    console.log(
      `${profile.label} last accessed stadia ${
        new Date(Number(lastAccessedStadia.toString()) / 1000 - 11644473600000)
          .toISOString()
      }`,
    );
  } else {
    console.log(`${profile.label} has never accessed Stadia.`);
  }
}
