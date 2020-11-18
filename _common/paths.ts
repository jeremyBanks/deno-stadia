let tempDir: string | undefined;

export const getTempDir = () => {
  if (tempDir) {
    return tempDir;
  }

  let candidate;

  try {
    candidate = Deno.env.get("TMPDIR") || Deno.env.get("TMP") ||
      Deno.env.get("TEMP") || "/tmp";
  } catch (error) {
    if (error instanceof Deno.errors.PermissionDenied) {
      candidate = "/tmp";
    } else {
      throw error;
    }
  }

  if (!(Deno.statSync(candidate)).isDirectory) {
    throw new Error(`temporary directory does not exist: ${candidate}`);
  }

  return tempDir = candidate;
};
