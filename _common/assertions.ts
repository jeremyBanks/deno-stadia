/** Returns the name and source location of the caller of the caller of this. */
const caller = () =>
  (new Error()).stack?.split(/\n\ \ /g)[3]?.trim().slice(3) ?? `<unknown>`;

export class AssertionError extends Error {
  name = "AssertionError";
}

export function assert<T>(
  condition: T,
  message?: string,
): asserts condition {
  if (!condition) {
    throw new AssertionError(message ?? `assertion failed in ${caller()}`);
  }
}

export function expect<T>(
  value: T,
  message?: string,
): NonNullable<T> {
  assert(value != null, message ?? `expected non-null value but was ${value}`);
  return value as NonNullable<T>;
}

export class NotImplementedError extends Error {
  name = "NotImplementedError";
}

export const notImplemented = (message?: any): any => {
  throw new NotImplementedError(message ?? `not implemented in ${caller()}`);
};

export const unreachable = (message?: any): never => {
  throw new TypeError(
    message ??
      `logic error: this code was expected to be unreachable in ${caller()}`,
  );
};
