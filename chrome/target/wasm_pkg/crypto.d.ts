/* tslint:disable */
/* eslint-disable */
/**
* @param {Uint8Array} key
* @param {Uint8Array} nonce
* @param {Uint8Array} ciphertext
* @returns {string}
*/
export function aes_gcm_256_decrypt_and_verify_as_utf8(
  key: Uint8Array,
  nonce: Uint8Array,
  ciphertext: Uint8Array,
): string;

export type InitInput =
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly aes_gcm_256_decrypt_and_verify_as_utf8: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
  ) => void;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number) => void;
  readonly __wbindgen_realloc: (a: number, b: number, c: number) => number;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init(
  module_or_path?: InitInput | Promise<InitInput>,
): Promise<InitOutput>;
