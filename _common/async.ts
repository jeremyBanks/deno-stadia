export const throttled = <F extends Function>(
  intervalSeconds: number,
  f: F,
): F => {
  let tail: Promise<unknown> = Promise.resolve();

  return (async (...args: any) => {
    const previousTail = tail;
    tail = previousTail.then(() => sleep(intervalSeconds));
    await previousTail;
    return f(...args);
  }) as unknown as F;
};

export const sleep = async (seconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};
