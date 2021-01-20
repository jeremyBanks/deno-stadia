# [deno.land/x/gaming](https://deno.land/x/gaming)

[<img alt="latest release" src="https://img.shields.io/github/v/tag/jeremyBanks/gaming?label=latest%20release&logo=deno&style=flat-square&logoColor=white">](http://deno.land/x/gaming)
[<img alt="commits" src="https://img.shields.io/github/commits-since/jeremyBanks/gaming/latest/trunk?label=commits%20since%20release&logo=git&style=flat-square&logoColor=white">](https://github.com/jeremyBanks/gaming/commits/trunk)
[<img alt="checks" src="https://img.shields.io/github/checks-status/jeremyBanks/gaming/trunk?logo=github-actions&style=flat-square&logoColor=white">](https://github.com/jeremyBanks/gaming/actions)
[<img alt="pull requests" src="https://img.shields.io/github/issues-pr-raw/jeremyBanks/gaming?logo=github&style=flat-square&logoColor=white">](http://deno.land/x/gaming)<br>
[<img alt="stadia: under development" src="https://img.shields.io/badge/stadia-under_development-yellow?logo=stadia&logoColor=D72D30&style=flat-square">](https://stadia.com/)
[<img alt="xbox: not supported" src="https://img.shields.io/badge/xbox-not_supported-663333?logo=xbox&logoColor=107C10&style=flat-square">](https://xbox.com/)
[<img alt="PlayStation: not supported" src="https://img.shields.io/badge/playstation-not_supported-663333?logo=playstation&logoColor=003087&style=flat-square">](https://www.playstation.com/)
[<img alt="steam: not supported" src="https://img.shields.io/badge/steam-not_supported-663333?logo=steam&style=flat-square">](https://steampowered.com/)

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
$ deno run --allow-all "https://deno.land/x/gaming/stadia.ts"
```

You may install this tool as a local `stadia` command:

```
$ sudo deno install --reload --allow-all --force --root "/usr/local" "https://deno.land/x/gaming/stadia.ts"

$ stadia
```

```
error: RangeError: Maximum call stack size exceeded
    at getBaseConstraintOfType (deno:cli/tsc/00_typescript.js:53240:41)
    at getTypeFacts (deno:cli/tsc/00_typescript.js:62711:37)
    at getTypeFacts (deno:cli/tsc/00_typescript.js:62711:24)
    at getTypeFacts (deno:cli/tsc/00_typescript.js:62711:24)
    at getTypeFacts (deno:cli/tsc/00_typescript.js:62711:24)
    at getTypeFacts (deno:cli/tsc/00_typescript.js:62711:24)
    at getTypeFacts (deno:cli/tsc/00_typescript.js:62711:24)
    at getTypeFacts (deno:cli/tsc/00_typescript.js:62711:24)
    at getTypeFacts (deno:cli/tsc/00_typescript.js:62711:24)
    at getTypeFacts (deno:cli/tsc/00_typescript.js:62711:24)

```

## Disclaimer

This is an unofficial fan project and is not affiliated with Google. The name
"Stadia" is a trademark of Google LLC, and is used here for informational
purposes, not to imply affiliation or endorsement.

## License

Copyright Jeremy Banks and
[contributors](https://github.com/jeremyBanks/gaming/graphs/contributors).

Licensed under either of

 * [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)
 * [MIT license](http://opensource.org/licenses/MIT)

at your option.

### Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in the work by you, as defined in the Apache-2.0 license, shall be
dual licensed as above, without any additional terms or conditions.
