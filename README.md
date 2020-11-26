This is an unofficial in-progress/unstable/pre-1.0 library/CLI tool for
interacting with your Stadia account, using the Deno JavaScript runtime.

⚠️ Features may not be implemented or may not function as describe, and this may
only work on Windows 10 using WSL Ubuntu and Chrome, with all Deno permissions
allowed.

## install Deno runtime (dependency)

```sh
curl -fsSL https://deno.land/x/install/install.sh | sh
# or see https://deno.land/manual/getting_started/installation
```

## invocation or installation

### run latest release remotely

```sh
deno run --allow-all "https://deno.land/x/stadia/mod.ts" [...<args>]
```

### install and run latest release locally

```sh
sudo deno install --reload --allow-all --force --root "/usr/local" "https://deno.land/x/stadia/mod.ts"
stadia ...<args>
```

### run trunk remotely

```sh
deno run --reload --allow-all "https://raw.githubusercontent.com/stadians/deno-stadia/trunk/mod.ts" [...<args>]
```

## usage

```sh
Unofficial Stadia CLI

USAGE:

    stadia [--google-email=<email> | --google-cookies=<cookies> | --offline] <command> [<args>...]

AUTHENTICATION:

    You must authenticate with Google Stadia in one of the following ways:

    The --google-cookie= parameter may be set with a header-style semicolon-
    delimited Cookie string containing at least the three Google authentication
    cookies "SID", "SSID", and "HSID".

    If using Google Chrome on Windows 10 and running this command within
    Windows Subsystem for Linux, it will be able to automatically detect any
    Chrome Profiles that are synced with a Google account and load their
    authentication cookies for you. If there are multiple synced profiles, you
    may specify one to use with the --google-email= parameter.

    You may specify --offline to disable authentication, but
    any command that requires data that is not already saved locally will fail.

COMMANDS:

    stadia auth

        Prints information about the authenticated user.

    stadia run <game_name | game_id>

        Launch a Stadia game in Chrome, specified by name or ID.

    stadia captures list

        Lists captured images and video.

    stadia users profile <user_id>

        Displays basic profile information for the user with the given ID.

    stadia store update

        Updates the local Stadia store catalogue.

    stadia store search <name>

        Search the local Stadia store catalogue.

```
