// utils/encryption.js
import CryptoJS from "crypto-js";

/**
 * Generate a random chat key (Base64 string).
 * Using Base64 string keeps compatibility with CryptoJS passphrase mode.
 * We generate 32 random bytes then encode to Base64.
 */
export const generateChatKey = () => {
  return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64);
};

/**
 * Ensure there is a chat key saved for a given chatId.
 * Returns existing key or generates+saves a new one.
 */
export const ensureChatKey = (chatId) => {
  if (!chatId) return null;
  const k = loadChatKey(chatId);
  if (k) return k;
  const newKey = generateChatKey();
  saveChatKey(chatId, newKey);
  return newKey;
};

/**
 * Encrypt text using AES (passphrase mode).
 * Returns a ciphertext string (base64 + metadata) produced by CryptoJS.
 */
export const encryptMessage = (plainText, passphrase) => {
  if (!plainText) return null;
  if (!passphrase) {
    console.warn("encryptMessage called without passphrase");
    return null;
  }
  return CryptoJS.AES.encrypt(plainText, passphrase).toString();
};

/**
 * Decrypt text using AES (passphrase mode).
 * If decryption yields empty string, return null (so caller can decide).
 */
export const decryptMessage = (ciphertext, passphrase) => {
    console.log("ciphertext", ciphertext);
    console.log("passphrase", passphrase)
  if (!ciphertext) return null;
  if (!passphrase) {
    console.warn("decryptMessage called without passphrase");
    return "[Unable to decrypt]";
  }

  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedText) {
      // empty string means decryption failed or plaintext was empty
      console.warn("decryptMessage: empty result — wrong key or corrupted ciphertext");
      return "[Unable to decrypt]";
    }
    return decryptedText;
  } catch (err) {
    console.error("decryptMessage error:", err);
    return "[Unable to decrypt]";
  }
};

// Save / load chat key in localStorage (simple client-side storage)
export const saveChatKey = (chatId, key) => {
  if (!chatId || !key) return;
  try {
    localStorage.setItem(`chatKey_${chatId}`, key);
  } catch (err) {
    console.warn("saveChatKey failed:", err);
  }
};
export const loadChatKey = (chatId) => {
  if (!chatId) return null;
  try {
    return localStorage.getItem(`chatKey_${chatId}`);
  } catch (err) {
    console.warn("loadChatKey failed:", err);
    return null;
  }
};
