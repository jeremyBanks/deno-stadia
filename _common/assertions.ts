/** Returns the name and source location of the caller of the caller of this. */
const caller = () =>
  (new Error()).stack?.split(/\n\ \ /g)[3]?.trim().slice(3) ?? `<unknown>`;

export class AssertionError extends Error {
  name = "AssertionError";
}

export function assert(
  condition: any,
  message?: string,
): asserts condition {
  if (!condition) {
    throw new AssertionError(message ?? `assertion failed in ${caller()}`);
  }
}

export class NotImplementedError extends Error {
  name = "NotImplementedError";
}

export const notImplemented = (..._: any): any => {
  throw new NotImplementedError(`not implemented in ${caller()}`);
};

export const unreachable = (..._: any): never => {
  throw new TypeError(`logic error: this code was expected to be unreachable`);
};
