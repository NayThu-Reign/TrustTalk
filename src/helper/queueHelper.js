export const OFFLINE_QUEUE_KEY = "offline_message_queue";

export const saveToQueue = (message) => {
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
  queue.push(message);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

export const removeFromQueue = (tempId) => {
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
  const updated = queue.filter(m => m.client_temp_id !== tempId);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
};

export const getQueue = () => {
  return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
};
