# [deno-stadia](https://deno.land/x/stadia)

An Unofficial CLI tool and Deno TypeScript library for interacting with your
Google Stadia account.

**⚠️ Until its 1.0 release, this tool is incomplete and unsupported. Features
may not be implemented, or may not function as described. Come back later. ⚠️**

To use this tool you'll need to install [Deno, a secure runtime for TypeScript
and JavaScript](https://deno.land/). On Linux, you may do so by running:

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
error: Uncaught (in promise) PermissionDenied: network access to "https://raw.githubusercontent.com/DjDeveloperr/deno-canvas/master/canvaskit.wasm", run again with the --allow-net flag
    at processResponse (core.js:223:11)
    at Object.jsonOpAsync (core.js:240:12)
    at async fetch (deno:op_crates/fetch/26_fetch.js:1274:29)
    at async https://deno.land/x/canvas@v1.0.4/lib.js:6:14

```

## Disclaimer

deno-stadia is an unofficial fan project and is not affiliated with Google. The
name "Stadia" is a trademark of Google LLC, and is used here for informational
purposes, not to imply affiliation or endorsement.

## License

Copyright Jeremy Banks and
[contributors](https://github.com/jeremyBanks/deno-stadia/graphs/contributors).

Licensed under either of

 * [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)
 * [MIT license](http://opensource.org/licenses/MIT)

at your option.

### Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in the work by you, as defined in the Apache-2.0 license, shall be
dual licensed as above, without any additional terms or conditions.
