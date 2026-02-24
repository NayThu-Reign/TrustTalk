// src/crypto/backup.js
import sodium from "libsodium-wrappers-sumo";

export async function createBackupBase64(keyPair, passphrase) {
  await sodium.ready;

  const keyJson = JSON.stringify(keyPair);
  const plaintext = sodium.from_string(keyJson);

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
  combined.set(salt, 0);
  combined.set(nonce, salt.length);
  combined.set(ciphertext, salt.length + nonce.length);

  const b64 = sodium.to_base64(combined, sodium.base64_variants.ORIGINAL);
  return b64;
}

export async function restoreKeyPairFromBase64(backupBase64, passphrase) {
  await sodium.ready;

  const combined = sodium.from_base64(backupBase64, sodium.base64_variants.ORIGINAL);

  const saltLen = sodium.crypto_pwhash_SALTBYTES;
  const nonceLen = sodium.crypto_secretbox_NONCEBYTES;

  const salt = combined.slice(0, saltLen);
  const nonce = combined.slice(saltLen, saltLen + nonceLen);
  const ciphertext = combined.slice(saltLen + nonceLen);

  const pwKey = sodium.crypto_pwhash(
    sodium.crypto_secretbox_KEYBYTES,
    sodium.from_string(passphrase),
    salt,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_DEFAULT
  );

  let decrypted;
  try {
    decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, pwKey);
  } catch (e) {
    throw new Error("Invalid passphrase or corrupted backup");
  }

  const jsonStr = sodium.to_string(decrypted);
  return JSON.parse(jsonStr);
}

