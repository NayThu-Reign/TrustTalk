import sodium from "libsodium-wrappers";

self.onmessage = async (event) => {
  const { id, action, payload } = event.data;

  try {
    await sodium.ready;

    if (action === "encrypt") {
       const { plaintext, keyBase64 } = payload;
        const key = sodium.from_base64(keyBase64);
        const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
        const ciphertext = sodium.crypto_secretbox_easy(plaintext, nonce, key);
        self.postMessage({ id, result: { ciphertext: sodium.to_base64(ciphertext), nonce: sodium.to_base64(nonce) } });
    }

    else if (action === "decrypt") {
       const { ciphertext, nonce, keyBase64 } = payload;
        const key = sodium.from_base64(keyBase64);
        const decrypted = sodium.crypto_secretbox_open_easy(
            sodium.from_base64(ciphertext),
            sodium.from_base64(nonce),
            key
        );
        self.postMessage({ id, result: sodium.to_string(decrypted) });
    }

     else if (action === "file_encrypt") {
    const { chatId, arrayBuffer,keyBase64 } = payload;
      const key = sodium.from_base64(keyBase64);
        const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);


          console.log("keyBase64forfile24", keyBase64);
          console.log("nonceforfile24", nonce);



    if (!key) {
      return self.postMessage({ error: "Missing chat key" });
    }

   
    const ciphertext = sodium.crypto_secretbox_easy(
      new Uint8Array(arrayBuffer),
      nonce,
      key
    );

    self.postMessage({ id, result: { ciphertext: sodium.to_base64(ciphertext), nonce: sodium.to_base64(nonce) } });

    // self.postMessage({ ciphertext, nonce });
  } else if (action === "file_decrypt") {
      const { ciphertext, nonce, keyBase64 } = payload;

      // ensure inputs are standard base64 (not URL-safe); caller should have normalized but double-check
      const ctextStd = ciphertext.replace(/-/g, "+").replace(/_/g, "/");
      const nonceStd = nonce.replace(/-/g, "+").replace(/_/g, "/");

      const key = sodium.from_base64(keyBase64);
      console.log("keyfordecrypt", key);
      console.log("nonceStd", nonce);
      const decryptedUint8 = sodium.crypto_secretbox_open_easy(
        sodium.from_base64(ctextStd),
        sodium.from_base64(nonceStd),
        key
      );

      console.log("decryptUnit8", decryptedUint8);

      // Post the ArrayBuffer and transfer it for efficiency
      self.postMessage({ id, result: decryptedUint8.buffer }, [decryptedUint8.buffer]);
      return;
    }

    // Unknown action
    self.postMessage({ id, error: "Unknown action: " + action });
  } catch (err) {
    self.postMessage({ id, error: err.message || String(err) });
  }

};

// Notify manager that worker is ready
(async () => {
  await sodium.ready;
  self.postMessage("ready");
})();
