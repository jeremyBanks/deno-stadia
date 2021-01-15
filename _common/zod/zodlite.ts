import { log, sqlite, z } from "../../deps.ts";
import { assert, unreachable } from "../assertions.ts";
import { decode as jsonDecode, encode as jsonEncode } from "../json.ts";
import { encodeSQLiteIdentifier, SQL, SQLExpression, toSQL } from "../sql.ts";

const printableAscii = z.string().regex(
  /^[\x20-\x7E]*$/,
  "printable ascii",
);

await log.setup({
  handlers: {
    console: new class extends log.handlers.ConsoleHandler {
      constructor() {
        super("DEBUG");
      }
      log(msg: string): void {
        console.log(msg);
      }
    }(),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console"],
    },
  },
});

const TableName = printableAscii.min(1).max(64).regex(
  /^[a-z0-9\_\$]+$/i,
);
type TableName = z.infer<typeof TableName>;

const ColumnName = printableAscii.min(1).max(128).regex(
  /^[a-z0-9\_\$]+(\.[a-z0-9\_\$]+)*$/i,
);
type ColumnName = z.infer<typeof ColumnName>;

const ColumnType = z.enum(["virtual", "indexed", "unique"]);
type ColumnType = z.infer<typeof ColumnType>;

const ColumnDefinitions = z.record(ColumnType);
type ColumnDefinitions = z.infer<typeof ColumnDefinitions>;

class Column<ParentTable extends Table> {
  constructor(
    readonly table: ParentTable,
    readonly name: ColumnName,
    readonly type: ColumnType,
  ) {
    this.name = ColumnName.parse(name);
  }

  readonly id = SQL`${this.table}.${encodeSQLiteIdentifier(this.name)}`;

  [toSQL](): SQLExpression {
    return this.id;
  }
}

class Table<
  Value = unknown,
  ValueSchema extends z.ZodSchema<Value> = z.ZodSchema<Value>,
  ChildColumnDefinitions extends ColumnDefinitions = {},
> {
  constructor(
    readonly database: Database<{}>,
    readonly name: TableName,
    readonly schema: ValueSchema,
    private readonly columnDefinitions: ChildColumnDefinitions,
  ) {
    this.name = TableName.parse(this.name);
  }

  readonly id = encodeSQLiteIdentifier(this.name);

  [toSQL](): SQLExpression {
    return this.id;
  }

  readonly columns: {
    [columnName in keyof ColumnDefinitions]: Column<this>;
  } = Object.fromEntries(
    Object.keys(this.columnDefinitions).map(
      (columnName) => [
        columnName,
        new Column(
          this,
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
        where ${options?.where ?? SQL`1=1`}`,
      )
    ) {
      return count;
    }
    return unreachable();
  }

  insert(value: Value, options?: {
    unchecked?: "unchecked";
  }): unknown {
    if (options?.unchecked !== "unchecked") {
      value = this.schema.parse(value);
    }
    this.database.sql(
      SQL`insert or replace into ${this} (json)
      values (${jsonEncode(value)})`,
    ).return();
    return value;
  }

  *select(options?: {
    where?: SQLExpression;
    orderBy?: SQLExpression;
    unchecked?: "unchecked";
  }): Iterable<Value> {
    for (
      const [json] of this.database.sql(
        SQL`select json from ${this}
        where ${options?.where ?? SQL`1=1`}
        order by ${options?.orderBy ?? SQL`rowid asc`}`,
      )
    ) {
      const uncheckedValue = jsonDecode(json);
      let value;
      if (options?.unchecked !== "unchecked") {
        value = this.schema.parse(uncheckedValue);
      } else {
        value = uncheckedValue as unknown as Value;
      }
      yield value;
    }
  }
}

class Database<
  TableDefinitions extends {
    [tableName: string]: {
      type: z.ZodType<unknown>;
      columns?: {
        [columnName: string]: ColumnType;
      };
    };
  },
> {
  constructor(
    readonly path: string,
    private readonly tableDefinitions: TableDefinitions,
  ) {}

  readonly connection = new sqlite.DB(this.path);

  sql(query: SQLExpression) {
    log.debug(
      `${query.strings.join("?").trim()}${
        query.values ? `\n${Deno.inspect(query.values)}` : ``
      }`,
    );
    return this.connection.query(...query.args);
  }

  readonly tables: {
    [tableName in keyof TableDefinitions]: Table<
      z.infer<TableDefinitions[tableName]["type"]>,
      TableDefinitions[tableName]["type"],
      NonNullable<TableDefinitions[tableName]["columns"]>
    >;
  } = Object.fromEntries(
    Object.keys(this.tableDefinitions).map(
      (tableName) => [
        tableName,
        new Table(
          this,
          tableName,
          this.tableDefinitions[tableName].type,
          this.tableDefinitions[tableName].columns ?? {},
        ),
      ],
    ),
  ) as any;

  get sugar(): this & this["tables"][any]["sugar"] {
    return Object.assign(
      Object.create(this) as this,
      Object.fromEntries(
        Object.entries(this.tables).map(
          ([key, value]) => [key, value.sugar],
        ),
      ) as this["tables"][any]["sugar"],
    );
  }

  readonly initialized = Object.keys(this.tables).forEach((tableName) => {
    const table = this.tables[tableName];

    let columns = SQL`
      rowid integer primary key autoincrement not null,
      json text not null check (json(json) is not null)`;

    let indexCreations = [];

    for (
      let [columnName, columnType] of Object.entries(
        this.tableDefinitions[tableName].columns ?? {},
      )
    ) {
      columnName = ColumnName.parse(columnName);
      columnType = ColumnType.parse(columnType);

      const id = encodeSQLiteIdentifier(columnName);
      const indexId = encodeSQLiteIdentifier(
        `index.${tableName}.${columnName}`,
      );
      const extraction = new SQLExpression([`'$.${columnName}'`]);
      if (columnType === "virtual") {
        columns = SQL`${columns},
          ${id} any always generated as (json_extract(json, ${extraction})) virtual`;
      } else if (columnType === "indexed") {
        columns = SQL`${columns},
          ${id} any always generated as (json_extract(json, ${extraction})) stored`;
        indexCreations.push(SQL`create index ${indexId} on ${table} (${id})`);
      } else if (columnType === "unique") {
        columns = SQL`${columns},
          ${id} any unique generated always as (json_extract(json, ${extraction})) stored`;
      } else {
        return unreachable();
      }
    }

    this.sql(SQL`create table if not exists ${table} (${columns});`);
    for (const statement of indexCreations) {
      this.sql(statement);
    }
  });
}

setTimeout(() => {
  const db = new Database("example.sqlite", {
    Sku: {
      type: z.object({
        skuId: z.number(),
        request: z.any().array().nullable(),
        data: z.object({
          name: z.string().nonempty(),
          releaseTimestamp: z.number(),
        }).nullable(),
      }),
      columns: {
        "skuId": "unique",
        "data.name": "virtual",
        "data.releaseTimestamp": "indexed",
      },
    },
  }).sugar;

  for (let i = 0; i < 100; i += 9) {
    db.Sku.insert({
      skuId: i,
      request: [],
      data: {
        name: "test",
        releaseTimestamp: 100,
      },
    });
  }

  for (const sku of db.Sku.select({ where: SQL`${db.Sku.skuId} > ${80}` })) {
    console.log(sku);
  }
}, 500);
// const ZZZ: any = {};

// const TableDefinition = <
//   ValueType extends unknown,
//   ValueTypeSchema extends z.ZodSchema<ValueType>,
// >(table: TableDefinition<ValueType, ValueTypeSchema>) => table;

// type TableDefinition<
//   ValueType extends unknown,
//   ValueTypeSchema extends z.ZodSchema<ValueType>,
// > = {
//   type: ValueTypeSchema;
//   columns: {
//     [columnName: string]:
//       | "virtual" // an alias for SQL queries
//       | "indexed" // stored and indexed
//       | "unique"; // indexed + unique-or-null check
//   };
// };

// type TableFromDefinition<Definition> = Definition extends
//   TableDefinition<infer ValueType, infer ValueTypeSchema> ? {
//     type: ValueTypeSchema,
//     select(condition?: SQLExpression): Iterable<ValueType>;
//   } : "TypeError: T in Table<T> must extend Definition";

// type Table<T, U> = TableFromDefinition<TableDefinition<T, U>>;

// type Database<T> = {
//   [K in keyof T]: T[K] extends TableDefinition<infer ValueType, infer ValueTypeSchema> ? T[K]
//     : never;
// }[keyof T];

// const open = <Definition extends TableDefinition<unknown, z.ZodSchema<unknown>>>(path: string, definition: Definition): Database<Definition> => {
//   return Object.fromEntries(Object.entries(definition).map(([tableName, tableInfo]) => [tableName, {
//       type: tableInfo.type,
//       columns:
//   }

//   }]));
// }

// const table = open("foo.ts", {
//   Sku: {
//     type: z.object({
//       skuId: z.string().nonempty(),
//       request: z.any().array().nullable(),
//       data: z.object({
//         name: z.string().nonempty(),
//         releaseTimestamp: z.number(),
//       }).nullable(),
//     }),
//     columns: {
//       "skuId": "unique",
//       "data.name": "virtual",
//       "data.releaseTimestamp": "indexed",
//     },
//   },
// });
