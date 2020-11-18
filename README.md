Working on some scripts to interact with Stadia. Initially only intending to
support Chrome on Windows from WSL Ubuntu, and `--allow-all` permissions, but
aiming to be more flexible later.

## use

### run remotely

```
deno run --allow-all https://deno.land/x/stadia/mod.ts
```

### install/update locally

```
sudo deno install --reload --allow-all --force --root /usr/local https://deno.land/x/stadia/mod.ts
```

### run locally

```
stadia
```

## development

### rebuild rust components

```
./chrome/build.ts
```

### run locally

```
./mod.ts
```

