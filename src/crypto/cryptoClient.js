// cryptoClient.js
import sodium from "libsodium-wrappers";
import { getCryptoWorker } from "./cryptoWorkerManager";
import { rotateChatKey } from "../lib/libSodium";


//
// ─────────────────────────────────────────────────────────────
//   Helpers for key/version storage
// ─────────────────────────────────────────────────────────────
//
function getLatestVersion(chatId) {
  return sessionStorage.getItem(`chatkey_${chatId}_latestVersion`);
}

function getStoredChatKey(chatId, version) {
  return sessionStorage.getItem(`chatkey_${chatId}_v${version}`);
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

async function localDecrypt(keyBase64, ciphertext, nonce) {
  await sodium.ready;
  const key = sodium.from_base64(keyBase64);
  const decrypted = sodium.crypto_secretbox_open_easy(
    sodium.from_base64(ciphertext),
    sodium.from_base64(nonce),
    key
  );
  return sodium.to_string(decrypted);
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
  const keyBase64 = getStoredChatKey(chatId, version);

  if (!keyBase64) {
    throw new Error(`Missing key for chat ${chatId} v${version}`);
  }

  return callWorker("decrypt", {
    ciphertext,
    nonce,
    keyBase64,
  });
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

