import * as libsignal from "@privacyresearch/libsignal-protocol-typescript";
import { signalStore } from "./signalStoreInstance";
import { getFromDB, saveToDB, base64ToArrayBuffer } from "./signalStore";

// Helper: convert ArrayBuffer → base64
export function arrayBufferToBase64(buf) {
  if (!buf) return "";

  let bytes;
  if (buf instanceof ArrayBuffer) {
    bytes = new Uint8Array(buf);
  } else if (buf instanceof Uint8Array) {
    bytes = buf;
  } else if (typeof buf === "string") {
    // fallback for string-encoded binary data
    return btoa(buf);
  } else {
    console.error("⚠️ Unknown buffer type in arrayBufferToBase64:", buf);
    return "";
  }

  return btoa(String.fromCharCode(...bytes));
}


// Helper: convert base64 → ArrayBuffer
export function base64ToArrayBufferFixed(b64) {
  return base64ToArrayBuffer(b64);
}

function stringToArrayBuffer(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}


// Create session if not exists
export async function createSessionIfNeeded(targetUserCode, prekeyBundle) {
  const address = new libsignal.SignalProtocolAddress(targetUserCode, 1);
  const existing = await signalStore.loadSession(address.toString());
  if (existing) {
    console.log("📦 Existing session found, reusing.");
    return;
  }

  console.log("🧩 Creating new session with", targetUserCode);
  const sessionBuilder = new libsignal.SessionBuilder(signalStore, address);

  const bundle = {
    registrationId: prekeyBundle.registrationId,
    identityKey: base64ToArrayBufferFixed(prekeyBundle.identityKey),
    signedPreKey: {
      keyId: prekeyBundle.signedPreKey.keyId,
      publicKey: base64ToArrayBufferFixed(prekeyBundle.signedPreKey.publicKey),
      signature: base64ToArrayBufferFixed(prekeyBundle.signedPreKey.signature)
    },
    preKey: prekeyBundle.oneTimePreKey
      ? {
          keyId: prekeyBundle.oneTimePreKey.keyId,
          publicKey: base64ToArrayBufferFixed(prekeyBundle.oneTimePreKey.publicKey)
        }
      : null,
  };

  await sessionBuilder.processPreKey(bundle);
  console.log("✅ Session established with", targetUserCode);
}

// Encrypt a message
export async function encryptMessage(targetUserCode, message) {
  const address = new libsignal.SignalProtocolAddress(targetUserCode, 1);
  const sessionCipher = new libsignal.SessionCipher(signalStore, address);

const result = await sessionCipher.encrypt(
  stringToArrayBuffer(message)
);


console.log("Encrypted message:", result);

const hasSession = await signalStore.containsSession(address.toString());


console.log("HAsSession", hasSession);


  if (result.type === 3) {
    // preKeyWhisperMessage
    return {
      message_type: "prekey_whisper",
      ciphertext: arrayBufferToBase64(result.body)
    };
  } else {
    // normal whisper message
    return {
      message_type: "whisper",
      ciphertext: arrayBufferToBase64(result.body)
    };
  }
}

// Decrypt a message
export async function decryptMessage(fromUserCode, messageObj) {
  const address = new libsignal.SignalProtocolAddress(fromUserCode, 1);
  const sessionCipher = new libsignal.SessionCipher(signalStore, address);
  let plaintext;

  const bytes = base64ToArrayBufferFixed(messageObj.ciphertext);

  if (messageObj.message_type === "prekey_whisper") {
    plaintext = await sessionCipher.decryptPreKeyWhisperMessage(bytes, "binary");
  } else {
    plaintext = await sessionCipher.decryptWhisperMessage(bytes, "binary");
  }

  return new TextDecoder().decode(plaintext);
}
