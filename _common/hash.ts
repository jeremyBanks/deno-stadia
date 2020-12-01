import { Shake256 } from "https://deno.land/std@0.79.0/hash/sha3.ts";

import * as base64url from "https://deno.land/std@0.74.0/encoding/base64url.ts";

const multihashes = {
  // https://github.com/multiformats/multicodec/blob/master/table.csv#L16
  shake256d256: {
    new: () => new Shake256(256),
    prefix: new Uint8Array([0x19, 256 / 8]),
  },
};

const multibases = {
  // https://github.com/multiformats/multibase/blob/master/multibase.csv#L23
  u: {
    encode: (bytes: Uint8Array) => base64url.encode(bytes.buffer),
    prefix: "u",
  },
};

const hash = multihashes.shake256d256;
const base = multibases.u;

export const digest = (data: Uint8Array): Uint8Array => {
  const hasher = hash.new();
  hasher.update(data);
  const digest = new Uint8Array(hasher.digest());
  const taggedDigest = new Uint8Array(hash.prefix.length + digest.length);
  taggedDigest.set(hash.prefix, 0);
  taggedDigest.set(digest, hash.prefix.length);
  return taggedDigest;
};

export const stringDigest = (data: Uint8Array): string => {
  const digestBytes = digest(data);
  return base.prefix + base.encode(digestBytes);
};

export default digest;
