import { sqlite, z } from "../deps.ts";
import * as json from "../_common/json.ts";
import { Json } from "../_common/json.ts";
import { unreachable } from "./assertions.ts";

const printableAscii = z.string().regex(
  /^[\x20-\x7E]*$/,
  "printable ascii",
);
const defaultPath = ":memory:";
export const DefaultKey = printableAscii.min(1).max(512);
export type DefaultKey = z.infer<typeof DefaultKey>;
export const DefaultValue = Json;
export type DefaultValue = z.infer<typeof DefaultValue>;

export class ZodSqliteMap<
  KeySchema extends z.Schema<Key>,
  ValueSchema extends z.Schema<Value>,
  Key extends string = z.infer<KeySchema>,
  Value extends Json = z.infer<ValueSchema>,
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
    this.db.query(
      `create table
      if not exists
      Entry (
        pk integer primary key,
        key text unique,
        value text
      )`,
    ).return();
  }

  get(key: Key): Value | undefined {
    const unchecked = this.getUnchecked(this.keySchema.parse(key));
    if (unchecked === undefined) {
      return unchecked;
    } else {
      return this.valueSchema.parse(unchecked);
    }
  }

  getUnchecked(key: Key): Value | undefined {
    for (
      const [jsonValue] of this.db.query(
        `select value
        from Entry
        where key = ?`,
        [key],
      )
    ) {
      return json.decode(jsonValue) as Value;
    }
  }

  set(key: Key, value: Value) {
    return this.setUnchecked(
      this.keySchema.parse(key),
      this.valueSchema.parse(value),
    );
  }

  setUnchecked(key: Key, value: Value) {
    this.db.query(
      `insert into Entry(key, value)
      values (?, ?)
      on conflict(key)
      do update
      set value=excluded.value`,
      [key, json.encode(value, 0)],
    ).return();
    return this;
  }

  get size() {
    for (
      const [count] of this.db.query(
        `select count(*) from Entry`,
      )
    ) {
      return z.number().parse(count);
    }
    return unreachable("expected a row");
  }

  clear(): void {
    this.db.query(`delete from Entry`).return();
  }

  delete(key: Key): boolean {
    return this.deleteUnchecked(this.keySchema.parse(key));
  }

  deleteUnchecked(key: Key): boolean {
    this.db.query(`delete from Entries where key = ?`, [key]).return();
    return this.db.changes > 0;
  }

  *entries(): Generator<[Key, Value]> {
    for (
      const [key, value] of this.entriesUnchecked()
    ) {
      yield [
        this.keySchema.parse(key),
        this.valueSchema.parse(value),
      ];
    }
  }

  *entriesUnchecked(): Generator<[Key, Value]> {
    for (
      const [key, value] of this.db.query(
        `select key, value
        from Entry
        order by pk asc`,
      )
    ) {
      yield [
        key as Key,
        json.decode(value) as Value,
      ];
    }
  }

  *keys(): Generator<Key> {
    for (
      const key of this.keysUnchecked()
    ) {
      yield this.keySchema.parse(key);
    }
  }

  *keysUnchecked(): Generator<Key> {
    for (
      const [key] of this.db.query(
        `select key
        from Entry
        order by pk asc`,
      )
    ) {
      yield key as Key;
    }
  }

  *values(): Generator<Value> {
    for (
      const value of this.valuesUnchecked()
    ) {
      yield this.valueSchema.parse(value);
    }
  }

  *valuesUnchecked(): Generator<Value> {
    for (
      const [value] of this.db.query(
        `select value
        from Entry
        order by pk asc`,
      )
    ) {
      yield json.decode(value) as Value;
    }
  }

  has(key: Key): boolean {
    for (
      const [count] of this.db.query(
        `select count(*)
        from Entry
        where key = ?`,
        [key],
      )
    ) {
      return z.number().parse(count) > 0;
    }
    return unreachable("expected a row");
  }

  [Symbol.iterator]() {
    return this.entries();
  }

  forEach(
    callbackfn: (value: Value, key: Key, map: Map<Key, Value>) => void,
    thisArg?: Map<Key, Value>,
  ): void {
    for (const [key, value] of this.entries()) {
      callbackfn(value, key, thisArg ?? this);
    }
  }

  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
}
