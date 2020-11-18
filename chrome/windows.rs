use {
    std::{
        convert::TryFrom,
        io::{stdin, stdout, Read, Write},
        process::exit,
        slice,
    },
    winapi::{
        ctypes::c_void,
        um::{
            dpapi::{CryptUnprotectData, CRYPTPROTECT_PROMPTSTRUCT},
            winbase::LocalFree,
            wincrypt::CRYPTOAPI_BLOB,
        },
    },
};

fn main() {
    let mut plaintext: Vec<u8> = Vec::new();

    stdin()
        .read_to_end(&mut plaintext)
        .expect("failed reading plaintext from stdin");

    let mut input = CRYPTOAPI_BLOB {
        cbData: u32::try_from(plaintext.len()).expect("plaintext length didn't fit in a u32!?"),
        pbData: plaintext.as_mut_ptr(),
    };

    let cleartext: Result<Vec<u8>, &str>;

    unsafe {
        let mut output = CRYPTOAPI_BLOB::default();

        if CryptUnprotectData(
            &mut input,
            0 as *mut *mut u16,
            0 as *mut CRYPTOAPI_BLOB,
            0 as *mut c_void,
            0 as *mut CRYPTPROTECT_PROMPTSTRUCT,
            0 as u32,
            &mut output,
        ) != 0
        {
            cleartext = Ok(slice::from_raw_parts(
                output.pbData,
                usize::try_from(output.cbData)
                    .expect("something's wrong. are you running on a 16-bit OS?"),
            )
            .iter()
            .cloned()
            .collect());
        } else {
            cleartext = Err("decryption failed")
        }

        LocalFree(output.pbData as *mut c_void);
    }

    match cleartext {
        Ok(cleartext) => {
            stdout()
                .write_all(&cleartext)
                .expect("everything is fucked");
        }
        Err(error_message) => {
            eprintln!("{}", error_message);
            exit(1);
        }
    }
}
