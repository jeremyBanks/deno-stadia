import wasm from "./_generated/crypto.wasm.js";
import init from "./_generated/crypto_bindings.js";

await init(wasm);

export {
  aes_gcm_256_decrypt_and_verify_as_utf8 as aesGcm256DecryptAndVerifyAsUtf8,
} from "./_generated/crypto_bindings.js";
