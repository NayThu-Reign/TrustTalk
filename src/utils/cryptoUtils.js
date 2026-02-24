import sodium from "libsodium-wrappers";

let isReady = false;

export async function initSodium() {
  if (!isReady) {
    await sodium.ready;
    isReady = true;
  }
  return sodium;
}

export function base64ToUint8(b64) {
  return sodium.from_base64(b64);
}

export function uint8ToBase64(u8) {
  return sodium.to_base64(u8);
}
