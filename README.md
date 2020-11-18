## use

This script requires `--allow-run` (to access Windows APIs that aren't exposed
through Deno's sandbox), and most other permissions too, so I use `--allow-all`.

### run remotely

```
deno run --reload --allow-all https://deno.land/x/stadia/mod.ts
```

### install/update

```
sudo deno install --reload --allow-all --force --root /usr/local https://deno.land/x/stadia/mod.ts
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

