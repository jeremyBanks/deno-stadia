Utilities for accessing the local user's Chrome profile data, such as to import
session cookies. These include two supporting Rust binaries, which are compiled
and inlined into `.ts` files for use at runtime:

- `crypto.rs` provides the RustCrypto implementation of AES-GCM-256 decoding as
  a WASM binary. This is the format Chrome uses to encrypt cookies. (Very old
  cookies may use a different format, which we do not support.)

- `windows.rs` provides the Windows dpapi's `CryptUnprotectData` function as a
  Windows binary. This is the method used by Chrome on Windows to protect the
  AES-GCM-256 encryption key required above.
