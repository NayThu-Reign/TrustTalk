let workerInstance = null;
let workerReady = false;
const pendingQueue = [];

// Lazy-load the worker (runs only once)
export function getCryptoWorker() {
  if (!workerInstance) {
    workerInstance = new Worker(new URL("./cryptoWorker.js", import.meta.url), {
      type: "module",
    });

    // When worker responds with "ready"
    workerInstance.onmessage = (event) => {
      if (event.data === "ready") {
        workerReady = true;
        // Resolve all queued promises
        while (pendingQueue.length > 0) {
          const resolve = pendingQueue.shift();
          resolve(workerInstance);
        }
      }
    };
  }

  if (workerReady) {
    return Promise.resolve(workerInstance);
  }

  // Queue requests until ready
  return new Promise((resolve) => pendingQueue.push(resolve));
}
