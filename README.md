This is an unofficial in-progress/unstable/pre-1.0 library/CLI tool for
interacting with your Stadia account. **⚠️ This tool is incomplete. Features
may not be implemented or may not function as described. Come back later. ⚠️**

You'll need to install [Deno, a secure runtime for TypeScript and
JavaScript](https://deno.land/). On Linux, you may do so by running:

```
$ curl -fsSL https://deno.land/x/install/install.sh | sh
```

You may run the latest release of this tool directly from Deno's module hosting:

```
$ deno run --allow-all "https://deno.land/x/stadia/mod.ts"
```

You may install this tool as a local `stadia` command:

```
$ sudo deno install --reload --allow-all --force --root "/usr/local" "https://deno.land/x/stadia/mod.ts"

$ stadia
```

```
Unofficial Stadia CLI (https://deno.land/x/stadia)

USAGE:

    stadia [<authentication>] <command> [<arguments>...]

AUTHENTICATION:

    You must authenticate with Google Stadia in one of the following ways:

    (1) If using Google Chrome on Windows 10 and running this command within
        Windows Subsystem for Linux, it will detect any Chrome Profiles that are
        synced with a Google account and load their authentication cookies
        automatically. If there are multiple synced profiles, you will be
        prompted to pick one, or you may specify it with the
        --google-email=<email> parameter.

    (2) The --google-cookie=<cookies> parameter may be set to a header-style
        semicolon-delimited Cookie string that will be used to authenticate with
        Google. This should contain the Google authentication cookies "SID",
        "SSID", and "HSID".

    (3) --offline will disable all authentication and network
        operations. Operations that require data that isn't already saved
        locally will fail.

LOCAL STATE:

    Local state is persisted in a SQLite database named "./deno-stadia.sqlite"
    in the current working directory. It may contain personal information such
    as your Google ID, your email address, and the list of games you own on
    Stadia, but it will never include any of your credentials, so you can share
    it without worrying about giving others access to your Google account.

COMMANDS:

    stadia auth

        Prints information about the authenticated user.

    stadia fetch [--json] <stadia_url>

        Fetches a Stadia URL and displays our internal representation of the
        response. The default output is meant for humans. The [--json] flag
        adds more detail for machines.

```
