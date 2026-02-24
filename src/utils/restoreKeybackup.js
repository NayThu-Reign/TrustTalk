import sodium from "libsodium-wrappers-sumo";


export const restoreFromKeybackupFile = async (file, passphrase) => {
  await sodium.ready;

  const arrayBuffer = await file.arrayBuffer();
  const encryptedBytes = new Uint8Array(arrayBuffer);

  // Extract salt, nonce, ciphertext from the combined array
  const saltLen = sodium.crypto_pwhash_SALTBYTES;
  const nonceLen = sodium.crypto_secretbox_NONCEBYTES;

  const salt = encryptedBytes.slice(0, saltLen);
  const nonce = encryptedBytes.slice(saltLen, saltLen + nonceLen);
  const ciphertext = encryptedBytes.slice(saltLen + nonceLen);

  // Derive the same key from passphrase + salt
  const pwKey = sodium.crypto_pwhash(
    sodium.crypto_secretbox_KEYBYTES,
    sodium.from_string(passphrase),
    salt,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_DEFAULT
  );

  // Attempt decryption
  const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, pwKey);

  if (!decrypted) {
    throw new Error("Invalid passphrase or corrupted backup file");
  }

  const jsonStr = sodium.to_string(decrypted);
  const keyPair = JSON.parse(jsonStr);

  if (!keyPair.publicKeyBase64 || !keyPair.secretKeyBase64) {
    throw new Error("Invalid key backup file structure");
  }

  return keyPair;
};
