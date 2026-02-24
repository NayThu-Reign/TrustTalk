export async function encryptFileBeforeUpload(file, chatId,version = null) {
  const arrayBuffer = await file.arrayBuffer();

  return new Promise((resolve, reject) => {
    // ✅ Correct Vite worker import
    const worker = new Worker(new URL("./cryptoWorker.js", import.meta.url), {
      type: "module",
    });

    // Handle result
   
    const latestVersion =
    version || sessionStorage.getItem(`chatkey_${chatId}_latestVersion`);


    const keyBase64 = sessionStorage.getItem(
    `chatkey_${chatId}_v${latestVersion}`
  );

  



    // ✅ Match worker’s message format
    worker.postMessage({
      id: crypto.randomUUID(),
      action: "file_encrypt",
      payload: { chatId, arrayBuffer,keyBase64 },
    });


   worker.onmessage = (e) => {
  // Ignore the initial "ready" signal
  if (e.data === "ready") return;

  console.log("Worker returned:", e.data);

  if (e.data.error) {
    reject(new Error(e.data.error));
  } else if (e.data.result) {
    const { ciphertext, nonce } = e.data.result;
    resolve({ ciphertext, nonce });
  } else {
    reject(new Error("Unexpected worker response"));
  }

  worker.terminate();
};


    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
    };

  });
}
