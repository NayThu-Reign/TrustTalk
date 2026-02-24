import sodium from "libsodium-wrappers-sumo";

export const createKeyBackupFile = async (keyPair, passphrase) => {
  await sodium.ready; // this ensures the WASM module is initialized

  console.log("Available sodium methods:", Object.keys(sodium));

  const keyJson = JSON.stringify(keyPair);
  const plaintext = sodium.from_string(keyJson);

  // ✅ Check that randombytes_buf exists
  if (typeof sodium.randombytes_buf !== "function") {
    throw new Error("libsodium did not initialize properly. Check bundler configuration.");
  }

  const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
  const pwKey = sodium.crypto_pwhash(
    sodium.crypto_secretbox_KEYBYTES,
    sodium.from_string(passphrase),
    salt,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_DEFAULT
  );

  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(plaintext, nonce, pwKey);

  const combined = new Uint8Array(salt.length + nonce.length + ciphertext.length);
  combined.set(salt);
  combined.set(nonce, salt.length);
  combined.set(ciphertext, salt.length + nonce.length);

  return new Blob([combined], { type: "application/octet-stream" });
};
