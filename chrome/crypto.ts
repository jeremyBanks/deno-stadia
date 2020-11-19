import wasm from "./_crypto_wasm.js";
import init from "./_crypto.js";

await init(wasm);

export {
  aes_gcm_256_decrypt_and_verify_as_utf8 as aesGcm256DecryptAndVerifyAsUtf8,
  sha_512_trunc_256_hex as sha512trunc256Hex,
} from "./_crypto.js";
