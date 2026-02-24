// signalStore.js
import localforage from "localforage";

const PREFIX = "signal-";

/**
 * Normalizes the address argument that libsignal passes.
 * libsignal may pass either a SignalProtocolAddress instance or a string.
 * We always convert to a stable string key via .toString()
 */
function addressToKey(address) {
  if (!address && address !== 0) return String(address);
  try {
    // If it's an object with toString() (SignalProtocolAddress), use that
    if (typeof address === "object" && typeof address.toString === "function") {
      return address.toString();
    }
    // otherwise fallback to string
    return String(address);
  } catch (e) {
    return String(address);
  }
}

const SignalProtocolStore = {
  // Identity / registration
  async getIdentityKeyPair() {
    return localforage.getItem(PREFIX + "identityKey");
  },

  async getLocalRegistrationId() {
    return localforage.getItem(PREFIX + "registrationId");
  },

  async put(key, value) {
    // generic put used by your code: key is a short name (no prefix expected)
    return localforage.setItem(PREFIX + key, value);
  },

  async getItem(key) {
    // generic get used by your code: key is a short name (no prefix expected)
    return localforage.getItem(PREFIX + key);
  },

  // Identity store expected by libsignal
  async saveIdentity(address, key) {
    const addr = addressToKey(address);
    return localforage.setItem(PREFIX + "identity-" + addr, key);
  },

  async loadIdentity(address) {
    const addr = addressToKey(address);
    return localforage.getItem(PREFIX + "identity-" + addr);
  },

  // Session store expected by libsignal
  async storeSession(address, record) {
    const addr = addressToKey(address);
    return localforage.setItem(PREFIX + "session-" + addr, record);
  },

  async loadSession(address) {
    const addr = addressToKey(address);
    const record = await localforage.getItem(PREFIX + "session-" + addr);
    return record || undefined;
  },

  async removeSession(address) {
    const addr = addressToKey(address);
    return localforage.removeItem(PREFIX + "session-" + addr);
  },

  // Prekeys
  async storePreKey(keyId, keyPair) {
    return localforage.setItem(PREFIX + "preKey-" + keyId, keyPair);
  },
  async loadPreKey(keyId) {
    return localforage.getItem(PREFIX + "preKey-" + keyId);
  },
  async removePreKey(keyId) {
    return localforage.removeItem(PREFIX + "preKey-" + keyId);
  },

  // Signed prekeys
  async storeSignedPreKey(keyId, keyPair) {
    return localforage.setItem(PREFIX + "signedPreKey-" + keyId, keyPair);
  },
  async loadSignedPreKey(keyId) {
    return localforage.getItem(PREFIX + "signedPreKey-" + keyId);
  },

  // Trust check
  async isTrustedIdentity(address, identityKey, direction) {
    // For a prototype it's fine to always return true.
    // In production you'd verify user identity here.
    return true;
  },

  // convenience remove
  async removeItem(key) {
    return localforage.removeItem(PREFIX + key);
  }
};

export default SignalProtocolStore;
