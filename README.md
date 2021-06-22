# [<img src="stadia.run/stadian.png" height="105" alt="deno.land/x/gaming" />](https://deno.land/x/gaming "deno.land/x/gaming")

[<img alt="latest release" src="https://img.shields.io/github/v/tag/jeremyBanks/gaming?label=released&logo=deno&style=flat-square&logoColor=white" height="20">](http://deno.land/x/gaming)
[<img alt="unreleased commits on trunk" src="https://img.shields.io/github/commits-since/jeremyBanks/gaming/latest/trunk?label=unreleased&logo=git&style=flat-square&logoColor=white" height="20">](https://github.com/jeremyBanks/gaming/commits/trunk)
[<img alt="github actions checks of trunk" src="https://img.shields.io/github/checks-status/jeremyBanks/gaming/trunk?logo=github-actions&style=flat-square&logoColor=white" height="20">](https://github.com/jeremyBanks/gaming/actions)
[<img alt="unmerged pull requests for trunk" src="https://img.shields.io/github/issues-search?query=repo%3AjeremyBanks%2Fgaming%20is%3Apr%20is%3Aopen%20base%3Atrunk&label=unmerged&logo=github&style=flat-square&logoColor=white" height="20">](https://github.com/jeremyBanks/gaming/pulls?q=is%3Apr+is%3Aopen+base%3Atrunk)
<br>
[<img alt="stadia: in progress" src="https://img.shields.io/badge/stadia-in_progress-yellow?logo=stadia&logoColor=D72D30&style=flat-square" height="20">](https://stadia.com/)
[<img alt="xbox: not supported" src="https://img.shields.io/badge/xbox-no-663333?logo=xbox&logoColor=107C10&style=flat-square" height="20">](https://xbox.com/)
[<img alt="PlayStation: not supported" src="https://img.shields.io/badge/playstation-no-663333?logo=playstation&logoColor=003087&style=flat-square">](https://playstation.com/)
[<img alt="steam: not supported" src="https://img.shields.io/badge/steam-no-663333?logo=steam&style=flat-square">](https://steampowered.com/)

An Unofficial CLI tool and Deno TypeScript library for interacting with your
Google Stadia account.

**⚠️ Until its 1.0 release, this tool is incomplete and unsupported. Features
may not be implemented, or may not function as described. Come back later. ⚠️**

To use this tool you'll need to install
[Deno, a secure runtime for TypeScript and JavaScript](https://deno.land/). On
Linux, you may do so by running:

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
<--- Last few GCs --->

[12195:0x391400000000]    82564 ms: Scavenge 1373.2 (1436.4) -> 1369.1 (1438.9) MB, 4.8 / 0.0 ms  (average mu = 0.929, current mu = 0.640) allocation failure 
[12195:0x391400000000]    82723 ms: Scavenge 1375.1 (1438.9) -> 1370.8 (1439.4) MB, 7.3 / 0.0 ms  (average mu = 0.929, current mu = 0.640) allocation failure 
[12195:0x391400000000]    82897 ms: Scavenge 1376.9 (1439.4) -> 1372.6 (1457.1) MB, 8.6 / 0.0 ms  (average mu = 0.929, current mu = 0.640) allocation failure 


<--- JS stacktrace --->


#
# Fatal javascript OOM in Reached heap limit
#
```

## Disclaimer

This is an unofficial fan project and is not affiliated with Google. The name
"Stadia" is a trademark of Google LLC, and is used here for informational
purposes, not to imply affiliation or endorsement.

## License

Copyright Jeremy Banks and
[contributors](https://github.com/jeremyBanks/gaming/graphs/contributors).

Licensed under either of

- [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)
- [MIT license](http://opensource.org/licenses/MIT)

at your option.

### Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in the work by you, as defined in the Apache-2.0 license, shall be
dual licensed as above, without any additional terms or conditions.
