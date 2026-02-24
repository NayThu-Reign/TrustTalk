import CryptoJS from "crypto-js";

const SECRET_KEY = "chat-secret-key-123"; // keep consistent

export const encryptId = (id) => {
  return CryptoJS.AES.encrypt(String(id), SECRET_KEY).toString();
};

export const decryptId = (cipher) => {
  const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
