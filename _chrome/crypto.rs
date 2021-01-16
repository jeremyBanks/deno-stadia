use wasm_bindgen::prelude::*;

use aes_gcm::aead::{generic_array::GenericArray, Aead, NewAead};
use aes_gcm::Aes256Gcm;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn aes_gcm_256_decrypt_and_verify_as_utf8(
    key: &[u8],
    nonce: &[u8],
    ciphertext: &[u8],
) -> String {
    console_error_panic_hook::set_once();

    assert!(
        key.len() == 32,
        "key length must be 32 bytes, but was {}",
        key.len()
    );
    assert!(
        nonce.len() == 12,
        "nonce length must be 12 bytes, but was {}",
        nonce.len()
    );

    let nonce = GenericArray::from_slice(nonce);
    let key = GenericArray::from_slice(key);
    let cipher = Aes256Gcm::new(key);

    let plaintext = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .expect("AES-GCM decryption/verification failure");

    return String::from_utf8(plaintext).expect("utf-8 decoding failure");
}
