Working on some scripts to interact with Stadia. Initially only intending to
support Chrome on Windows from WSL Ubuntu, and `--allow-all` permissions, but
aiming to be more flexible later.

# install Deno runtime (dependency)

```sh
curl -fsSL https://deno.land/x/install/install.sh | sh
 #or see https://deno.land/manual/getting_started/installation
```

# invocation or installation

## run remotely

```sh
deno run --allow-all "https://deno.land/x/stadia/mod.ts" [...ARGS]
```

## install and run locally

```sh
sudo deno install --reload --allow-all --force --root "/usr/local" "https://deno.land/x/stadia/mod.ts"
stadia [...ARGS]
```

# usage

```sh
stadia [CREDENTIALS] COMMAND [...COMMAND_ARGS]
```

## credentials

Specify `CREDENTIALS` with none or one of:

- `--chrome-email=EXAMPLE@EXAMPLE.COM` to use the Google with the given email
  (which must be synced with a Chrome profile on this machine).
- `--google-cookies=COOKIES` to explicitly specify the Google authentication
  cookie to use (in semicolon-delimited header format).
- `--offline` to disable authentication, and only allow commands that can run
  using locally information (if any).

If none are specified, the user will be prompted to select from Google accounts
synced with local Chrome profiles, if any are detected, or the command fails.

## commands

### whoami

```sh
stadia [CREDENTIALS] whoami
```

Verifies that we are able to authenticate, then identifies the authenticated
user.

### captures

```sh
stadia [CREDENTIALS] captures
```

# development

## rebuild rust components

```sh
./chrome/build.ts
```

## run locally

```sh
./mod.ts [...args]
```
