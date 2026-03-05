import sodium from "libsodium-wrappers";

export async function encryptMessage(chatId, plaintext) {
  await sodium.ready;

  console.log("encryptingChatKeyId", chatId);
  const keyBase64 = localStorage.getItem(`chatkey_${chatId}`);
  if (!keyBase64) throw new Error("No chat key cached");
  
  const key = sodium.from_base64(keyBase64);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(plaintext, nonce, key);

  return {
    ciphertext: sodium.to_base64(ciphertext),
    nonce: sodium.to_base64(nonce),
  };
}

export async function decryptMessageWithChatKey(chatId, ciphertextBase64, nonceBase64) {
  if (!ciphertextBase64) return null;
  await sodium.ready;

  const chatKeyBase64 = localStorage.getItem(`chatkey_${chatId}`);
  if (!chatKeyBase64) throw new Error("Missing chat key for this chat");

  const key = sodium.from_base64(chatKeyBase64);
  const ciphertext = sodium.from_base64(ciphertextBase64);
  const nonce = sodium.from_base64(nonceBase64);

  const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  return sodium.to_string(decrypted);
}



export const rotateChatKey = async (chatId, participants) => {
  await sodium.ready;

  // 1️⃣ Generate a fresh symmetric chat key
  const newKey = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
  const newKeyBase64 = sodium.to_base64(newKey);

  // 2️⃣ Encrypt the new key for each participant with their public key
  const encryptedKeys = [];
  for (const user of participants) {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/keys/get/${user.user_code}`
    );
    const data = await res.json();

    const recipientPublicKey = sodium.from_base64(data.publicKeyBase64);
    const sealed = sodium.crypto_box_seal(newKey, recipientPublicKey);

    encryptedKeys.push({
      user_id: user.user_code,
      encrypted_chat_key: sodium.to_base64(sealed),
    });
  }

  // 3️⃣ Send sealed keys to backend — let backend assign new version
  const token = localStorage.getItem("token");
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/chats/${chatId}/rotate-key`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ new_encrypted_keys: encryptedKeys }),
    }
  );

  const result = await res.json();

  console.log("rotateChatKeyResult", result);

  if (result.status === 1) {
    const newVersion = result.version; // ✅ backend is authoritative
    console.log(`🔑 Chat key rotated to version v${newVersion}`);

    // 4️⃣ Cache locally for this user
    localStorage.setItem(`chatkey_${chatId}_v${newVersion}`, newKeyBase64);
    localStorage.setItem(`chatkey_${chatId}_latestVersion`, newVersion);

    return newVersion;
  } else {
    console.error("❌ Failed to rotate key:", result);
    throw new Error(result.error || "Key rotation failed");
  }
};


export async function handleFileDownload(item, chatId) {
  try {
    await sodium.ready;

    console.log("LatestVersion24", chatId);
     const latestVersion = localStorage.getItem(`chatkey_${chatId}_latestVersion`);

    // const keyBase64 = sessionStorage.getItem(`chatkey_${chatId}`);
     const keyBase64 = localStorage.getItem(
    `chatkey_${chatId}_v${latestVersion}`
  );
    if (!keyBase64) {
      alert("Missing chat key!");
      return;
    }

    const key = sodium.from_base64(keyBase64);
    const nonce = sodium.from_base64(item.nonce);

    // 🔹 1. Fetch the encrypted file

    const api = import.meta.env.VITE_API_URL;
    const response = await fetch(`${api}/${item.media_url}`);

    console.log("fileResponse", response);
    const encryptedBase64 = await response.text(); // 👈 your backend stores ciphertext as Base64 string

    // If backend serves binary ciphertext instead of Base64, use:
    // const encryptedArrayBuffer = await response.arrayBuffer();
    // const ciphertext = new Uint8Array(encryptedArrayBuffer);

    // 🔹 2. Convert Base64 → Uint8Array
    const ciphertext = sodium.from_base64(encryptedBase64.trim());

    // 🔹 3. Decrypt
    const decryptedBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);

    // 🔹 4. Convert decrypted content to Blob (binary file)
    const blob = new Blob([decryptedBytes], { type: item.media_type || "application/octet-stream" });

    // 🔹 5. Download decrypted file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.media_url.split("/").pop().replace(".enc", "");
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Decryption failed:", err);
    alert("Failed to decrypt file — maybe wrong key or corrupted data");
  }
}






