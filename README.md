Working on some scripts to interact with Stadia. Initially only intending to
support Chrome on Windows from WSL Ubuntu, and `--allow-all` permissions, but
aiming to be more flexible later.

## install Deno runtime

```sh
curl -fsSL https://deno.land/x/install/install.sh | sh
# or see https://deno.land/manual/getting_started/installation
```

## use

### run remotely

```sh
deno run --allow-all "https://deno.land/x/stadia/mod.ts"
```

### install/update locally

```sh
sudo deno install --reload --allow-all --force --root "/usr/local" "https://deno.land/x/stadia/mod.ts"
```

### run locally

```sh
stadia
```

## development

### rebuild rust components

```sh
./chrome/build.ts
```

### run locally

```sh
./mod.ts
```
