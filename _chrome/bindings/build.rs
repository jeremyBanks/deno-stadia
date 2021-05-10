// build.rs
fn main() {
  windows::build!(
    Windows::Win32::Security::{
      CryptUnprotectData,
      CRYPTOAPI_BLOB,
      CRYPTPROTECT_PROMPTSTRUCT,
    },
    Windows::Win32::SystemServices::{
      PWSTR,
      FALSE,
      LocalFree,
    }
  );
}
