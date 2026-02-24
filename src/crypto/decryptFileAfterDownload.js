// decryptFileAfterDownload.js
export async function decryptFileAfterDownload(ciphertextBase64, nonceBase64, chatId, version = null) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./cryptoWorker.js", import.meta.url), {
      type: "module",
    });

    const id = crypto.randomUUID();

    const onMessage = (e) => {
      const data = e.data;
      // ignore initial ready signal (object with ready:true)
      if (data && data.ready) return;

      // match the id
      if (!data || data.id !== id) return;

      // remove handlers & terminate
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      worker.terminate();

      if (data.error) {
        return reject(new Error(data.error));
      }
      if (data.result) {
        // result is ArrayBuffer (transferred)
        return resolve(data.result);
      }

      return reject(new Error("Unexpected worker response"));
    };

    const onError = (err) => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      worker.terminate();
      reject(err);
    };

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);

   


    // get key from session storage
    const latestVersion = version || sessionStorage.getItem(`chatkey_${chatId}_latestVersion`);
    const keyBase64 = sessionStorage.getItem(`chatkey_${chatId}_v${latestVersion}`);
    if (!keyBase64) {
      // cleanup
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      worker.terminate();
      return reject(new Error(`Missing key for chat ${chatId} v${latestVersion}`));
    }

    // normalize URL-safe base64 -> standard base64
    const normalize = (s) => s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");

    const payload = {
      ciphertext: normalize(ciphertextBase64),
      nonce: normalize(nonceBase64),
      keyBase64,
    };

    worker.postMessage({ id, action: "file_decrypt", payload });
  });
}
