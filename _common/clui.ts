import { BufReader } from "../_deps.ts";

// deno-lint-ignore ban-types
type NotUndefined = string | number | boolean | symbol | object | null | bigint;

/**
 * Prompts the user to select an item from an array, and returns it.
 *
 * If standard input is closed, or the user presses enter without selecting
 * a value, an optional default value will be returned instead. If no default
 * is specified, an Error will be thrown.
 */
export const choose = async <T extends NotUndefined>(
  options: T[],
  defaultChoice?: T,
): Promise<T> => {
  let choice: T | undefined;

  if (options.length === 0) {
    choice = defaultChoice;
  } else if (
    options.length === 1 &&
    (defaultChoice === undefined || defaultChoice === options[0])
  ) {
    choice = options[0];
  } else {
    const maxDigits = options.length.toString().length;
    for (const [i, option] of options.entries()) {
      const n = i + 1;
      if (option === defaultChoice) {
        await printLineToStdErr(
          ` [${n.toString().padStart(maxDigits)}.] ${option}`,
        );
      } else {
        await printLineToStdErr(
          `  ${n.toString().padStart(maxDigits)}.  ${option}`,
        );
      }
    }

    let prompt;
    if (defaultChoice !== undefined) {
      prompt =
        "Enter the number of your choice, or nothing for the default:\n> ";
    } else {
      prompt = "Enter the number of your choice:\n> ";
    }
    const input = (await readLineFromStdIn(prompt) || "").trim();
    const isNaturalNumber = /^[0-9]+\.?$/.test(input);

    if (!input) {
      choice = defaultChoice;
    } else if (!isNaturalNumber) {
      throw new Error(
        `input (${JSON.stringify(input)}) must be a positive whole number`,
      );
    } else {
      const number = parseInt(input, 10);
      if (number < 1 || number > options.length) {
        throw new Error(
          `input (${number}) must be between 1 and ${options.length}`,
        );
      }
      choice = options[number - 1];
    }
  }

  if (choice === undefined) {
    throw new Error("required choice missing");
  }

  return choice;
};

const stdin = new BufReader(Deno.stdin);
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const printLineToStdErr = async (s: unknown) => {
  await Deno.stderr.write(textEncoder.encode(`${s}\n`));
};

const readLineFromStdIn = async (prompt = "") => {
  if (prompt) {
    await Deno.stderr.write(textEncoder.encode(`${prompt}`));
  }
  return stdin.readString("\n");
};
