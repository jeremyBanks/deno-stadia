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

### run remotely

```sh
deno run --allow-all "https://deno.land/x/stadia/mod.ts" [...<args>]
```

### install and run locally

```sh
sudo deno install --reload --allow-all --force --root "/usr/local" "https://deno.land/x/stadia/mod.ts"
stadia ...<args>
```

## usage

```sh
usage: stadia [--d] <command> [<args>]

```
