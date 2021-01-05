import { sqlite, z } from "../deps.ts";
import * as json from "../_common/json.ts";
import { Json } from "../_common/json.ts";
import { unreachable } from "./assertions.ts";

const defaultPath = ':memory:';
const DefaultKey = z.string().min(1).max(256);
const DefaultValue = Json;

export default class ZodSqliteMap<
  Key extends string = string,
  Value extends Json = Json,
  ValueSchema extends z.Schema<Value> = z.Schema<never>,
  KeySchema extends z.Schema<Key> = z.Schema<never>,
> implements Map<Key, Value> {
  public static open(path: string = defaultPath) {
    return new this(path, DefaultKey, DefaultValue);
  }

  readonly db: sqlite.DB = new sqlite.DB(this.path);

  constructor(
    readonly path: string,
    readonly keySchema: KeySchema,
    readonly valueSchema: ValueSchema,
  ) {
    this.db.query(`
      create table if not exists
      Entry (
        index integer primary key,
        key text unique,
        value text
      )
    `).return();
  }

  get [Symbol.toStringTag]() {
    return "ZodSqliteMap";
  }

  get(key: Key): Value | undefined {
    key = this.keySchema.parse(key);
    for (const [jsonValue] of this.db.query(`select value from Entry where key = ?`, [key])) {
      const value = json.decode(jsonValue);
      return this.valueSchema.parse(value);
    }
  }

  set(key: Key, value: Value) {
    key = this.keySchema.parse(key);
    value = this.valueSchema.parse(value);
    this.db.query(`insert or replace into Entry(key, value) values (?, ?)`, [key, json.encode(value)]).return();
    return this;
  }

  get size() {
    for (const row of this.db.query(`select count(*) from Entry`)) {
      return z.number().parse(row);
    }
    return unreachable("loop body expected to run");
  }

  clear(): void {
    this.db.query(`delete from Entries`);
  }

  delete(key: string): boolean {
    return notImplemented(key) as boolean;
  }

  entries() {
    return notImplemented() as IterableIterator<[string, Value]>;
  }

  [Symbol.iterator]() {
    return this.entries();
  }

  *keys() {
    for (const [key, _value] of this.entries()) {
      yield key;
    }
  }

  *values() {
    for (const [_key, value] of this.entries()) {
      yield value;
    }
  }

  forEach(
    callbackfn: (value: Value, key: string, map: Map<string, Value>) => void,
    thisArg?: Map<string, Value>,
  ): void {
    for (const [key, value] of this.entries()) {
      callbackfn(value, key, thisArg ?? this);
    }
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
}
