import { log, sqlite, z } from "../deps.ts";
import { unreachable } from "./assertions.ts";
import { decode as jsonDecode, encode as jsonEncode } from "./json.ts";
import {
  encodeSQLiteIdentifier,
  SQL,
  SQLExpression,
  SQLValue,
  toSQL,
} from "./sql.ts";

const printableAscii = z.string().regex(
  /^[\x20-\x7E]*$/,
  "printable ascii",
);

const TableName = printableAscii.min(1).max(64).regex(
  /^[a-z0-9\_\$]+$/i,
);
type TableName = z.output<typeof TableName>;

const ColumnName = printableAscii.min(1).max(128).regex(
  /^[a-z0-9\_\$]+(\.[a-z0-9\_\$]+)*$/i,
);
type ColumnName = z.output<typeof ColumnName>;

export const ColumnType = z.enum(["virtual", "indexed", "unique"]);
export type ColumnType = z.output<typeof ColumnType>;

export const ColumnDefinitions = z.record(ColumnType);
export type ColumnDefinitions = z.output<typeof ColumnDefinitions>;

export type TableDefinition = {
  rowType: z.ZodType<unknown>;
  columns?: {
    [columnName: string]: ColumnType;
  };
};

export type TableDefinitions = {
  [tableName: string]: TableDefinition;
};

class Column {
  constructor(
    readonly tableId: SQLExpression,
    readonly name: ColumnName,
    readonly type: ColumnType,
  ) {
    this.name = ColumnName.parse(name);
  }

  readonly id = SQL`${this.tableId}.${encodeSQLiteIdentifier(this.name)}`;

  [toSQL](): SQLExpression {
    return this.id;
  }

  lt(other: SQLValue) {
    return SQL`${this} < ${other}`;
  }

  lte(other: SQLValue) {
    return SQL`${this} <= ${other}`;
  }

  eq(other: SQLValue) {
    return SQL`${this} = ${other}`;
  }

  gte(other: SQLValue) {
    return SQL`${this} >= ${other}`;
  }

  gt(other: SQLValue) {
    return SQL`${this} > ${other}`;
  }

  ne(other: SQLValue) {
    return SQL`${this} != ${other}`;
  }

  isNull() {
    return SQL`${this} is null`;
  }

  notNull() {
    return SQL`${this} is not null`;
  }

  isJson() {
    return SQL`json_valid(${this})`;
  }
}

export class Table<
  Value,
  ValueSchema extends z.ZodSchema<Value, z.ZodTypeDef, Value> = z.ZodSchema<
    Value
  >,
  ThisColumnDefinitions extends ColumnDefinitions = {},
> {
  constructor(
    readonly database: Database<{}>,
    readonly name: TableName,
    readonly rowType: ValueSchema,
    private readonly columnDefinitions: ThisColumnDefinitions,
  ) {
    this.name = TableName.parse(this.name);
  }

  readonly id = encodeSQLiteIdentifier(this.name);

  [toSQL](): SQLExpression {
    return this.id;
  }

  readonly columns: {
    [columnName in keyof ThisColumnDefinitions]: Column;
  } = Object.fromEntries(
    Object.keys(this.columnDefinitions).map(
      (columnName) => [
        columnName,
        new Column(
          this.id,
          columnName,
          this.columnDefinitions[columnName],
        ),
      ],
    ),
  ) as any;

  get sugar(): this & this["columns"] {
    return Object.assign(Object.create(this) as this, this.columns);
  }

  count(options?: {
    where?: SQLExpression;
  }): number {
    for (
      const [count] of this.database.sql(
        SQL`select count(*) from ${this}
        where ${options?.where ?? SQL`true`}`,
      )
    ) {
      return count;
    }
    return unreachable();
  }

  insert(value: Value, options?: {
    unchecked?: "unchecked";
  }): boolean {
    if (options?.unchecked !== "unchecked") {
      value = this.rowType.parse(value);
    }
    log.debug(`inserting into ${this.name}: ${Deno.inspect(value)}`);
    this.database.sql(
      SQL`insert into ${this} (json)
      values (${jsonEncode(value)})
      on conflict do nothing`,
    ).return();
    return this.database.connection.changes > 0;
  }

  update(value: Value, options?: {
    unchecked?: "unchecked";
  }): unknown {
    if (options?.unchecked !== "unchecked") {
      value = this.rowType.parse(value);
    }
    log.debug(`insert-or-replacing into ${this.name}: ${Deno.inspect(value)}`);
    this.database.sql(
      SQL`insert or replace into ${this} (json)
      values (${jsonEncode(value)})`,
    ).return();
    return;
  }

  delete(options: {
    where: SQLExpression;
  }): number {
    this.database.sql(
      SQL`delete from ${this}
      where ${options?.where ?? SQL`true`}`,
    ).return();
    return this.database.connection.changes;
  }

  *select(options?: {
    top?: number,
    where?: SQLExpression;
    orderBy?: SQLExpression;
    unchecked?: "unchecked";
  }): Iterable<Value> {
    let limit = options?.top ?? Infinity;
    for (
      const [json] of this.database.sql(
        SQL`select json from ${this}
        where ${options?.where ?? SQL`true`}
        order by ${options?.orderBy ?? SQL`rowid asc`}`,
      )
    ) {
      if (limit <= 0) {
        break;
      } else {
        limit -= 1;
      }
      const uncheckedValue = jsonDecode(json);
      let value;
      if (options?.unchecked !== "unchecked") {
        value = this.rowType.parse(uncheckedValue);
      } else {
        value = uncheckedValue as unknown as Value;
      }
      yield value;
    }
  }

  first(options?: {
    where?: SQLExpression;
    orderBy?: SQLExpression;
    unchecked?: "unchecked";
  }): Value {
    for (const value of this.select(options)) {
      return value;
    }
    throw new TypeError("no results found for first()");
  }

  get(options?: {
    where?: SQLExpression;
    orderBy?: SQLExpression;
    unchecked?: "unchecked";
  }): Value | undefined {
    let result = undefined;
    for (const value of this.select(options)) {
      if (result !== undefined) {
        throw new TypeError("get() expects one result, but got more than one");
      }
      result = value;
    }
    return result;
  }
}

export class Database<
  ThisTableDefinitions extends TableDefinitions = {},
> {
  constructor(
    readonly path: string,
    private readonly tableDefinitions: ThisTableDefinitions,
  ) {}

  readonly connection = new sqlite.DB(this.path);

  sql(query: SQLExpression) {
    log.debug(
      `${query.strings.join("?").trim()}${
        query.values?.length ? `\n${Deno.inspect(query.values)}` : ``
      }`,
    );
    return this.connection.query(...query.args);
  }

  readonly tables: {
    [tableName in keyof ThisTableDefinitions]: Table<
      z.output<ThisTableDefinitions[tableName]["rowType"]>,
      ThisTableDefinitions[tableName]["rowType"],
      NonNullable<ThisTableDefinitions[tableName]["columns"]>
    >;
  } = Object.fromEntries(
    Object.keys(this.tableDefinitions).map(
      (tableName) => [
        tableName,
        new Table(
          this as any,
          tableName,
          this.tableDefinitions[tableName].rowType,
          this.tableDefinitions[tableName].columns ?? {},
        ),
      ],
    ),
  ) as any;

  readonly initialized = Object.keys(this.tables).forEach((tableName) => {
    const table = this.tables[tableName];

    let columns = SQL`
      rowId integer primary key autoincrement not null,
      json text not null check (json_valid(json))`;

    const indexCreations = [];

    for (
      let [columnName, columnType] of Object.entries(
        this.tableDefinitions[tableName].columns ?? {},
      )
    ) {
      columnName = ColumnName.parse(columnName);
      columnType = ColumnType.parse(columnType);

      const id = encodeSQLiteIdentifier(columnName.split(/\./g).pop()!);

      const extraction = new SQLExpression([`'$.${columnName}'`]);
      if (columnType === "virtual") {
        columns = SQL`${columns},
          ${id} dynamic generated always as (
            json_extract(json, ${extraction})
          ) virtual`;
      } else if (columnType === "indexed") {
        columns = SQL`${columns},
          ${id} dynamic generated always as (
            json_extract(json, ${extraction})
          ) stored`;
        indexCreations.push(
          SQL`create index if not exists
          ${
            encodeSQLiteIdentifier(
              `${tableName}.${columnName}::indexed`,
            )
          } on ${table} (${id})`,
        );
      } else if (columnType === "unique") {
        columns = SQL`${columns},
          ${id} dynamic generated always as (
            json_extract(json, ${extraction})
          ) stored`;
        indexCreations.push(
          SQL`create unique index if not exists
          ${
            encodeSQLiteIdentifier(
              `${tableName}.${columnName}::unique`,
            )
          } on ${table} (${id})`,
        );
      } else {
        return unreachable();
      }
    }

    this.sql(SQL`create table if not exists ${table} (${columns})`);
    for (const statement of indexCreations) {
      this.sql(statement);
    }
  });
}

export const open = <
  ThisTableDefinitions extends TableDefinitions,
>(
  path: string,
  tables: ThisTableDefinitions,
): (
  & Database<ThisTableDefinitions>
  & {
    [tableName in keyof Database<ThisTableDefinitions>["tables"]]: (
      & Database<ThisTableDefinitions>["tables"][tableName]
      & Database<ThisTableDefinitions>["tables"][tableName]["columns"]
    );
  }
) => {
  const db = new Database(path, tables);

  return Object.assign(
    Object.create(db) as typeof db,
    Object.fromEntries(
      Object.entries(db.tables as any).map(([tableName, table]) => {
        return [
          tableName,
          Object.assign(
            Object.create(table as any) as typeof table,
            (table as any).columns,
          ),
        ];
      }),
    ),
  ) as any;
};
