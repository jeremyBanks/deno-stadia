const utf8Encoder = new TextEncoder();

export const print = async (...args: unknown[]) =>
  Deno.writeAllSync(Deno.stdout, utf8Encoder.encode(`${args.join(" ")}`));

export const println = async (...args: unknown[]) =>
  Deno.writeAllSync(Deno.stdout, utf8Encoder.encode(`${args.join(" ")}\n`));

export const eprint = async (...args: unknown[]) =>
  Deno.writeAllSync(Deno.stderr, utf8Encoder.encode(`${args.join(" ")}`));

export const eprintln = async (...args: unknown[]) =>
  Deno.writeAllSync(Deno.stderr, utf8Encoder.encode(`${args.join(" ")}\n`));
