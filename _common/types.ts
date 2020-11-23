export type Json = null | number | string | boolean | JsonArray_ | JsonObject_;
// deno-lint-ignore no-empty-interface
interface JsonArray_ extends Array<Json> {}
// deno-lint-ignore no-empty-interface
interface JsonObject_ extends Record<string, Json> {}
