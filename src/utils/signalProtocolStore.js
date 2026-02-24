import { getDB } from "./signalStore";

export default class SignalProtocolStore {
  constructor() {
    this.store = null;
  }

  async _getStore() {
    if (!this.store) this.store = await getDB();
    return this.store;
  }

  // Encode ArrayBuffer to Base64 for safe storage
  _encode(value) {
    if (value instanceof ArrayBuffer) {
      return {
        __type: "ArrayBuffer",
        data: btoa(String.fromCharCode(...new Uint8Array(value))),
      };
    }
    return value;
  }

  // Decode Base64 back to ArrayBuffer
  _decode(value) {
    if (value && value.__type === "ArrayBuffer") {
      const binary = atob(value.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes.buffer;
    }
    return value;
  }

  async get(key, defaultValue) {
    const db = await this._getStore();
    const val = await db.get("keyvaluepairs", key);
    return val !== undefined ? this._decode(val) : defaultValue;
  }

  async put(key, value) {
    const db = await this._getStore();
    await db.put("keyvaluepairs", this._encode(value), key);
  }

  async remove(key) {
    const db = await this._getStore();
    await db.delete("keyvaluepairs", key);
  }

  // Required by libsignal
  async getIdentityKeyPair() {
    return this.get("identityKeyPair");
  }

  async getLocalRegistrationId() {
    return this.get("registrationId");
  }

  async loadSession(identifier) {
    return this.get(`session:${identifier}`);
  }

  async storeSession(identifier, record) {
    return this.put(`session:${identifier}`, record);
  }

  async containsSession(identifier) {
    const session = await this.loadSession(identifier);
    return !!session;
  }

  async isTrustedIdentity(identifier, identityKey) {
    const existing = await this.get(`identity-${identifier}`);
    if (!existing) return true;
    return arrayBufferEqual(existing, identityKey);
  }

  async saveIdentity(identifier, identityKey) {
    return this.put(`identity-${identifier}`, identityKey);
  }

  async loadPreKey(keyId) {
    return this.get(`25519KeypreKey${keyId}`);
  }

  async storePreKey(keyId, keyPair) {
    return this.put(`25519KeypreKey${keyId}`, keyPair);
  }

  async removePreKey(keyId) {
    return this.remove(`25519KeypreKey${keyId}`);
  }

  async loadSignedPreKey(keyId) {
    return this.get(`25519KeysignedKey${keyId}`);
  }

  async storeSignedPreKey(keyId, keyPair) {
    return this.put(`25519KeysignedKey${keyId}`, keyPair);
  }
}

// Helper for ArrayBuffer equality
function arrayBufferEqual(buf1, buf2) {
  if (!buf1 || !buf2 || buf1.byteLength !== buf2.byteLength) return false;
  const a = new Uint8Array(buf1);
  const b = new Uint8Array(buf2);
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
