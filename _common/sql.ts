import json, { Json } from "./json.ts";

export const SQL = (
  strings: TemplateStringsArray,
  ...values: (Json | SQLExpression)[]
) => {
  const flattened: (
    | { string: string; value?: undefined }
    | { value: Json; string?: undefined }
  )[] = [];

  for (let i = 0; i < strings.length; i++) {
    const string = strings[i];
    flattened.push({ string });

    if (i < values.length) {
      const value = values[i];
      if (value instanceof SQLExpression) {
        for (let j = 0; j < value.strings.length; j++) {
          flattened.push({ string: value.strings[j] });

          if (j < value.values.length) {
            flattened.push({ value: value.values[j] });
          }
        }
      } else if (typeof value === "object" && value !== null) {
        flattened.push({ value: json.encode(value, 0) });
      } else {
        flattened.push({ value });
      }
    }
  }

  const flattenedStrings = [];
  const flattenedValues = [];

  let stringBuffer = "";
  for (const { string, value } of flattened) {
    if (string !== undefined) {
      stringBuffer = (stringBuffer || "") + string;
    } else if (value !== undefined) {
      flattenedStrings.push(stringBuffer);
      stringBuffer = "";
      flattenedValues.push(value);
    } else {
      throw new TypeError("flattened[…].string and .value are both undefined");
    }
  }
  flattenedStrings.push(stringBuffer);

  return new SQLExpression(flattenedStrings, flattenedValues);
};

export class SQLExpression {
  constructor(
    readonly strings: string[] = [""],
    readonly values: Json[] = [],
  ) {
    if (strings.length !== values.length + 1) {
      throw new TypeError("strings.length !== values.length + 1");
    }
  }

  get args() {
    return [this.strings.join('?'), this.values] as const;
  }
}

export default SQL;
