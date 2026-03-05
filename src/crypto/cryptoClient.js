// cryptoClient.js
import sodium from "libsodium-wrappers";
import { getCryptoWorker } from "./cryptoWorkerManager";
import { rotateChatKey } from "../lib/libSodium";
import { fetchWithAuth } from "../hooks/fetchWithAuth";


//
// ─────────────────────────────────────────────────────────────
//   Helpers for key/version storage
// ─────────────────────────────────────────────────────────────
//

const api = import.meta.env.VITE_API_URL;

function getLatestVersion(chatId) {
  return localStorage.getItem(`chatkey_${chatId}_latestVersion`);
}

function getStoredChatKey(chatId, version) {
  return localStorage.getItem(`chatkey_${chatId}_v${version}`);
}

const decryptChatKey = async (chatKeyRecord, chatId) => {
  await sodium.ready;

  console.log("chatKeyRecord24", chatId);
  const { encrypted_chat_key,version  } = chatKeyRecord;
  const latestVersion = chatKeyRecord.version;
  console.log("chatKeyRecordVersion",latestVersion);
  const storedKeys = JSON.parse(localStorage.getItem("e2ee_keypair"));
  console.log("storedKeys", storedKeys);
  const myPrivateKey = sodium.from_base64(storedKeys.secretKeyBase64);
  const myPublicKey = sodium.from_base64(storedKeys.publicKeyBase64);

  const ciphertext = sodium.from_base64(encrypted_chat_key);

  console.log("ciphertext245", myPublicKey);
  console.log("chatKeyBase6424", version);
  const chatKeyUint8 = sodium.crypto_box_seal_open(ciphertext, myPublicKey, myPrivateKey);
  const chatKeyBase64 = sodium.to_base64(chatKeyUint8);




  localStorage.setItem(`chatkey_${chatId}_v${version}`, chatKeyBase64);
  localStorage.setItem(`chatkey_${chatId}_latestVersion`, version);

  console.log(`✅ Stored chat key v${version} for chat ${chatId}`);
};


async function getChatKey(chatId, version) {
  let keyBase64 = getStoredChatKey(chatId, version);

  if (!keyBase64) {
    try {
      const res = await fetchWithAuth(`${api}/api/chats/${chatId}/key`);
      const { keys } = await res.json();

      console.log("keys24", keys);

      for (const keyRecord of keys) {
        await decryptChatKey(keyRecord, chatId);
      }
      // const chatKeyRecord = await res.json();
      // keyBase64 = await decryptChatKey(chatKeyRecord, chatId); // assume returns Base64
      // localStorage.setItem(`chatkey_${chatId}_v${version}`, keyBase64);
    } catch (err) {
      console.warn("Failed to fetch key in realtime", err);
    }
  }

  if (!keyBase64) throw new Error(`Missing key for chat ${chatId} v${version}`);
  return keyBase64;
}

//
// ─────────────────────────────────────────────────────────────
//   LOCAL fallback (no worker)
// ─────────────────────────────────────────────────────────────
//
async function localEncrypt(keyBase64, plaintext) {
  await sodium.ready;
  const key = sodium.from_base64(keyBase64);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(plaintext, nonce, key);

  return {
    ciphertext: sodium.to_base64(ciphertext),
    nonce: sodium.to_base64(nonce),
  };
}

async function localDecrypt(keyBase64, ciphertext, nonce, messageId) {
  await sodium.ready;

  try {
    const keyBytes = sodium.from_base64(keyBase64);
    const nonceBytes = sodium.from_base64(nonce);
    const cipherBytes = sodium.from_base64(ciphertext);

    // sanity checks
    if (keyBytes.length !== 32) throw new Error("Invalid key length");
    if (nonceBytes.length !== 24) throw new Error("Invalid nonce length");
    if (cipherBytes.length < 16) throw new Error("Ciphertext too short");

    const decrypted = sodium.crypto_secretbox_open_easy(cipherBytes, nonceBytes, keyBytes);
    return sodium.to_string(decrypted);
  } catch (err) {
    console.error(`Failed to decrypt message ${messageId}:`, err.message);

    // cache the failure to skip retries
    const errors = JSON.parse(localStorage.getItem("decryptErrors") || "{}");
    errors[messageId] = err.message;
    localStorage.setItem("decryptErrors", JSON.stringify(errors));

    return null;
  }
}

//
// ─────────────────────────────────────────────────────────────
//   Worker bridge with graceful fallback
// ─────────────────────────────────────────────────────────────
//
async function callWorker(action, payload) {
  try {
    const worker = await getCryptoWorker();
    const id = crypto.randomUUID();

    return await new Promise((resolve, reject) => {
      const handler = (event) => {
        if (event.data.id !== id) return;

        worker.removeEventListener("message", handler);

        if (event.data.error) reject(new Error(event.data.error));
        else resolve(event.data.result);
      };

      worker.addEventListener("message", handler);
      worker.postMessage({ id, action, payload });
    });
  } catch (err) {
    console.warn("⚠️ Worker unavailable, falling back:", err);

    const { keyBase64 } = payload;

    if (action === "encrypt") {
      return localEncrypt(keyBase64, payload.plaintext);
    }

    if (action === "decrypt") {
      return localDecrypt(keyBase64, payload.ciphertext, payload.nonce);
    }

    throw err;
  }
}

//
// ─────────────────────────────────────────────────────────────
//   Automatically rotate key if missing
// ─────────────────────────────────────────────────────────────
//
async function ensureChatKey(chatId, participants) {
  let version = getLatestVersion(chatId);
  let keyBase64 = version ? getStoredChatKey(chatId, version) : null;

  // If missing, rotate chat key via backend
  if (!version || !keyBase64) {
    console.warn(`🔐 No local key found for chat ${chatId} — rotating key...`);

    const newVersion = await rotateChatKey(chatId, participants);

    version = newVersion;
    keyBase64 = getStoredChatKey(chatId, version);

    if (!keyBase64) {
      throw new Error("Key rotation succeeded but key not stored locally.");
    }
  }

  return { version, keyBase64 };
}

//
// ─────────────────────────────────────────────────────────────
//   PUBLIC: Encrypt message inside worker
// ─────────────────────────────────────────────────────────────
//
export async function encryptInWorker({ chatId, plaintext, participants }) {
  const { keyBase64 } = await ensureChatKey(chatId, participants);

  return callWorker("encrypt", {
    plaintext,
    keyBase64,
  });
}

//
// ─────────────────────────────────────────────────────────────
//   PUBLIC: Decrypt message (specific key version)
// ─────────────────────────────────────────────────────────────
//

export async function decryptInWorker({ chatId, ciphertext, nonce, version = 1 }) {
  const keyBase64 = await getChatKey(chatId, version);
  return callWorker("decrypt", { ciphertext, nonce, keyBase64 });
}

//
// ─────────────────────────────────────────────────────────────
//  PUBLIC: Encrypt files (worker)
// ─────────────────────────────────────────────────────────────
//
export async function encryptFileInWorker({ chatId, arrayBuffer, participants }) {
  const { keyBase64 } = await ensureChatKey(chatId, participants);

  const worker = await getCryptoWorker();
  const id = crypto.randomUUID();

  return await new Promise((resolve, reject) => {
    const handler = (event) => {
      if (event.data.id !== id) return;

      worker.removeEventListener("message", handler);

      if (event.data.error) reject(event.data.error);
      else resolve(event.data.result);
    };

    worker.addEventListener("message", handler);

    worker.postMessage({
      id,
      action: "file_encrypt",
      payload: { chatId, arrayBuffer, keyBase64 },
    });
  });
}

export async function decryptFileInWorker({ chatId, ciphertext, nonce, version }) {
  const keyBase64 = getStoredChatKey(38, version);
  if (!keyBase64) {
    throw new Error(`Missing key for chat 38 v${version}`);
  }

  return callWorker("file_decrypt", {
    ciphertext,
    nonce,
    keyBase64,
  });
}

