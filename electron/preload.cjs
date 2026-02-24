const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');


contextBridge.exposeInMainWorld('chat', {

  notify: ({ title, body }) => {
    new Notification({
      title,
      body,
      icon: path.join(__dirname, "..", "src", "assets", "splash_logo_tl_2.png"),
    }).show();
  },
});

contextBridge.exposeInMainWorld('messageDb', {
  // Message methods
  insertMessage: (message) => ipcRenderer.invoke('db:insert-message', message),
  insertMessages: (messages) => ipcRenderer.invoke('db:insert-messages', messages),
  getMessages: (chatId, limit, offset) => 
    ipcRenderer.invoke('db:get-messages', chatId, limit, offset),
  searchMessages: (query, chatId, limit) => 
    ipcRenderer.invoke('db:search-messages', query, chatId, limit),
  updateMessage: (messageId, updates) =>
    ipcRenderer.invoke('db:update-message', messageId, updates),
  deleteMessage: (messageId) =>
    ipcRenderer.invoke('db:delete-message', messageId),
  
  // ✅ NEW: Message stats
  getMessageCount: (chatId) => 
    ipcRenderer.invoke('db:get-message-count', chatId),
  getOldestMessageTime: (chatId) => 
    ipcRenderer.invoke('db:get-oldest-message-time', chatId),
  
  // ✅ NEW: Get single message and context
  getMessageById: (messageId) =>
    ipcRenderer.invoke('db:get-message-by-id', messageId),
  getMessagesAroundTimestamp: (chatId, timestamp, limit) =>
    ipcRenderer.invoke('db:get-messages-around-timestamp', chatId, timestamp, limit),
  
  // ✅ NEW: Background fetch status
  getBackgroundFetchStatus: (chatId) => 
    ipcRenderer.invoke('db:get-background-fetch-status', chatId),
  updateBackgroundFetchStatus: (chatId, updates) => 
    ipcRenderer.invoke('db:update-background-fetch-status', chatId, updates),
  resetBackgroundFetchStatus: (chatId) => 
    ipcRenderer.invoke('db:reset-background-fetch-status', chatId),
  
  // Chat methods
  insertChat: (chat) => ipcRenderer.invoke('db:insert-chat', chat),
  insertChats: (chats) => ipcRenderer.invoke('db:insert-chats', chats),
  getChats: (limit, offset) => ipcRenderer.invoke('db:get-chats', limit, offset),
  getChat: (chatId) => ipcRenderer.invoke('db:get-chat', chatId),
  upsertChat: (chat) => ipcRenderer.invoke('db:upsert-chat', chat),
  updateChatLastMessageTime: (chatId, lastMessageTime, unreadCount) => 
    ipcRenderer.invoke('db:update-chat-last-message', chatId, lastMessageTime, unreadCount),
  updateChatLastMessage: (chatId, lastMessage) => 
    ipcRenderer.invoke('db:update-chat-last-message', chatId, lastMessage),
  updateChatMute: (chatId, muteChat, mutedBy) => 
    ipcRenderer.invoke('db:update-chat-mute', chatId, muteChat, mutedBy),
  deleteChat: (chatId) => ipcRenderer.invoke('db:delete-chat', chatId),

  // ✅ NEW: Image downloa
  downloadImage: (url) => ipcRenderer.invoke('db:download-image', url),
});
