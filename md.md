```ts
import {
  GoogleCredentials,
  StadiaClient,
} from "https://deno.land/x/gaming/stadia.ts";

const credentials = await GoogleCredentials.findLocal({});

// What is our goal?
// Comparing achivements?

const stadia = new StadiaClient({ credentials });

const allGames = stadia.games();
const allProducts = stadia.skus();

const me: stadia.Player = await stadia.me();

const jeremy: stadia.Player = await stadia.user({
  name: "jeremy",
  number: "0000",
});

for (const game of jeremy.played) {
}
```
