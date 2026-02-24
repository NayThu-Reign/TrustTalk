import {
  KeyHelper,
  SessionBuilder,
  SessionCipher,
  SignalProtocolAddress
} from '@privacyresearch/libsignal-protocol-typescript';
import localforage from 'localforage';
import SignalProtocolStore from './signalStore';

// helpers: arraybuffer <-> base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}



export async function initIdentityAndPreKeys(user_code) {
  // 1. Generate identity & registration
  const identityKeyPair = await KeyHelper.generateIdentityKeyPair();
  const registrationId = await KeyHelper.generateRegistrationId();

  // 2. Generate signed prekey
  const signedPreKey = await KeyHelper.generateSignedPreKey(identityKeyPair, 1);

  // 3. Generate some one-time prekeys
  const oneTimePreKeys = [];
  const NUM_PREKEYS = 10;
  for (let i = 1; i <= NUM_PREKEYS; i++) {
    const preKey = await KeyHelper.generatePreKey(i + 1000);
    oneTimePreKeys.push(preKey);
  }

  // 4. Store locally
  await SignalProtocolStore.put("identityKey", identityKeyPair);
  await SignalProtocolStore.put("registrationId", registrationId);
  await SignalProtocolStore.put("signedPreKey_" + user_code, signedPreKey);
  await SignalProtocolStore.put("oneTimePreKeys_" + user_code, oneTimePreKeys);

  console.log(`✅ Identity and prekeys saved for user: ${user_code}`);

  // 5. Prepare public versions to send to server
  const identityKeyPublicBase64 = arrayBufferToBase64(identityKeyPair.pubKey);

  const signedPreKeyPublic = {
    keyId: signedPreKey.keyId,
    publicKey: arrayBufferToBase64(signedPreKey.keyPair.pubKey),
    signature: arrayBufferToBase64(signedPreKey.signature),
  };

  const oneTimePublic = oneTimePreKeys.map((k) => ({
    keyId: k.keyId,
    publicKey: arrayBufferToBase64(k.keyPair.pubKey),
  }));

  // 6. Upload to your API
  const api = import.meta.env.VITE_API_URL;

  const res = await fetch(`${api}/api/keys/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_code,
      identity_key: identityKeyPublicBase64,
      signed_pre_key: signedPreKeyPublic,
      one_time_pre_keys: oneTimePublic,
    }),
  });

  if (!res.ok) {
    console.error("❌ Failed to register keys on server");
    return false;
  }

  console.log("✅ Public keys uploaded successfully");
  return true;
}

export async function initSession(myUserCode, recipientUserCode) {
  const api = import.meta.env.VITE_API_URL;

  console.log("recipientUserCode", recipientUserCode);

  // 1️⃣ Fetch recipient’s public key bundle from your server
  const response = await fetch(`${api}/api/keys/get/${recipientUserCode}`);
  const bundle = await response.json();
  console.log("🔍 Received bundle:", bundle);

  // 2️⃣ Parse signed prekey (handle string case)
  const signedPreKey =
    typeof bundle.signed_pre_key === "string"
      ? JSON.parse(bundle.signed_pre_key)
      : bundle.signed_pre_key;

  // 3️⃣ Prepare preKeyBundle for libsignal
  const preKeyBundle = {
    registrationId: bundle.registrationId,
    identityKey: base64ToArrayBuffer(bundle.identity_key),
    signedPreKey: {
      keyId: signedPreKey.keyId,
      publicKey: base64ToArrayBuffer(signedPreKey.publicKey),
      signature: base64ToArrayBuffer(signedPreKey.signature),
    },
    preKey: bundle.one_time_prekey
      ? {
          keyId: bundle.one_time_prekey.keyId,
          publicKey: base64ToArrayBuffer(bundle.one_time_prekey.publicKey),
        }
      : undefined,
  };

  // 4️⃣ Create SignalProtocolAddress for recipient
  const address = new SignalProtocolAddress(recipientUserCode, 1);

  if (!myUserCode) {
    throw new Error("No user code found for the current user.");
  }

  // 5️⃣ Load your identity key pair (from store)
  const identityKeyPair = await SignalProtocolStore.getIdentityKeyPair();
  console.log("🔑 Identity Key Pair:", identityKeyPair);

  // 6️⃣ Build the session
  const sessionBuilder = new SessionBuilder(SignalProtocolStore, address);
  await sessionBuilder.processPreKey(preKeyBundle);

  console.log(`✅ Signal session initialized with ${recipientUserCode}`);
}


export async function encryptMessage(myUserCode, recipientUserCode, plaintext) {
  const address = new SignalProtocolAddress(recipientUserCode, 1);
  const cipher = new SessionCipher(SignalProtocolStore, address);

  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(plaintext).buffer;

  // Encrypt
  const ciphertext = await cipher.encrypt(plaintextBuffer);

  let messageBody =
    ciphertext.preKeySignalMessage ||
    ciphertext.signalMessage ||
    ciphertext.body;

  if (!messageBody) throw new Error("❌ Missing message body");

  // 🧩 Convert binary string → ArrayBuffer if needed
  let buffer;
  if (typeof messageBody === "string") {
    // Convert each char to byte
    const len = messageBody.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = messageBody.charCodeAt(i);
    }
    buffer = bytes.buffer;
  } else if (messageBody instanceof ArrayBuffer) {
    buffer = messageBody;
  } else if (messageBody.buffer) {
    buffer = messageBody.buffer;
  } else {
    throw new Error("❌ Unsupported ciphertext body type");
  }

  // Convert to Base64 safely
  const base64Cipher = arrayBufferToBase64(buffer);

  return {
    type: ciphertext.type,
    body: base64Cipher,
  };
}






export async function decryptMessage(myUserCode, senderUserCode, encryptedMessage) {
  try {
    // list localforage keys to inspect
console.log("localForageKeys", await localforage.keys());

    const address = new SignalProtocolAddress(senderUserCode, 1);
    const cipher = new SessionCipher(SignalProtocolStore, address);

    // 🧠 Extract ciphertext
    const { type, body } = encryptedMessage;
    if (!body) throw new Error("Empty ciphertext body");

    // 1️⃣ Decode from base64
    const decodedBody = base64ToArrayBuffer(body);

    const sessionKey = `signal-session-${senderUserCode}.1`;
const existingSession = await localforage.getItem(sessionKey);

console.log("🔍 Has session for", senderUserCode, "?", !!existingSession);

    let plaintextBuffer;

    // 2️⃣ Decrypt depending on message type
  if (type === 3) {
  const hasSession = !!existingSession;
  if (hasSession) {
    console.log("ℹ️ Session exists, treating type 3 as normal Signal message");
    plaintextBuffer = await cipher.decryptWhisperMessage(decodedBody, "binary");
  } else {
    console.log("ℹ️ No session yet, decrypting pre-key message");
    plaintextBuffer = await cipher.decryptPreKeyWhisperMessage(decodedBody, "binary");
  }
}


    // 3️⃣ Convert ArrayBuffer → UTF-8 string
    const decoder = new TextDecoder();
    const plaintext = decoder.decode(new Uint8Array(plaintextBuffer));

    console.log("✅ Decrypted plaintext:", plaintext);

    return plaintext;
  } catch (err) {
    console.error("❌ Decryption failed:", err);
    return "[Failed to decrypt]";
  }
}





