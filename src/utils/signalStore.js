import { openDB } from "idb";

// Database name
const DB_NAME = "chat-testing2-store";
const DB_VERSION = 1;
const STORE_NAME = "keyvaluepairs";

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function saveToDB(key, value) {
  const db = await getDB();
  await db.put(STORE_NAME, value, key);
}

export async function getFromDB(key) {
  const db = await getDB();
  return db.get(STORE_NAME, key);
}

export async function deleteFromDB(key) {
  const db = await getDB();
  return db.delete(STORE_NAME, key);
}

export async function clearDB() {
  const db = await getDB();
  return db.clear(STORE_NAME);
}

export function base64ToArrayBuffer(b64) {
  if (!b64 || typeof b64 !== "string") {
    throw new Error("Invalid base64 input");
  }

  // Convert base64url to standard base64
  b64 = b64.replace(/-/g, "+").replace(/_/g, "/");

  // Add padding if needed
  while (b64.length % 4 !== 0) {
    b64 += "=";
  }

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}


