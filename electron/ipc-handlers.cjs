const { ipcMain } = require('electron');
const messageDb = require('./db.cjs');

function setupIpcHandlers() {
  // Message handlers
  ipcMain.handle('db:insert-message', async (event, message) => {
    return messageDb.insertMessage(message);
  });

  ipcMain.handle('db:insert-messages', async (event, messages) => {
    return messageDb.insertMessages(messages);
  });

  ipcMain.handle('db:get-messages', async (event, conversationId, limit, offset) => {
    return messageDb.getMessages(conversationId, limit, offset);
  });

  ipcMain.handle('db:search-messages', async (event, query, conversationId, limit) => {
    return messageDb.searchMessages(query, conversationId, limit);
  });

  ipcMain.handle('db:advanced-search', async (event, options) => {
    return messageDb.advancedSearch(options);
  });

  // ✅ NEW: Message count and stats
  ipcMain.handle('db:get-message-count', async (event, chatId) => {
    return messageDb.getMessageCount(chatId);
  });

  ipcMain.handle('db:get-oldest-message-time', async (event, chatId) => {
    return messageDb.getOldestMessageTime(chatId);
  });

  // ✅ NEW: Get single message and messages around timestamp
  ipcMain.handle('db:get-message-by-id', async (event, messageId) => {
    return messageDb.getMessageById(messageId);
  });

  ipcMain.handle('db:get-messages-around-timestamp', async (event, chatId, timestamp, limit) => {
    return messageDb.getMessagesAroundTimestamp(chatId, timestamp, limit);
  });

  // ✅ NEW: Background fetch status handlers
  ipcMain.handle('db:get-background-fetch-status', async (event, chatId) => {
    return messageDb.getBackgroundFetchStatus(chatId);
  });

  ipcMain.handle('db:update-background-fetch-status', async (event, chatId, updates) => {
    return messageDb.updateBackgroundFetchStatus(chatId, updates);
  });

  ipcMain.handle('db:reset-background-fetch-status', async (event, chatId) => {
    return messageDb.resetBackgroundFetchStatus(chatId);
  });

  // Chat handlers
  ipcMain.handle('db:insert-chat', async (event, chat) => {
    return messageDb.insertChat(chat);
  });

  ipcMain.handle('db:insert-chats', async (event, chats) => {
    return messageDb.insertChats(chats);
  });

  ipcMain.handle('db:get-chats', async (event, limit, offset) => {
    return messageDb.getChats(limit, offset);
  });

  ipcMain.handle('db:get-chat', async (event, chatId) => {
    return messageDb.getChat(chatId);
  });

  ipcMain.handle('db:upsert-chat', async (event, chat) => {
    return messageDb.upsertChat(chat);
  });

  ipcMain.handle('db:update-chat-last-message', async (event, chatId, lastMessageTime, unreadCount) => {
    return messageDb.updateChatLastMessage(chatId, lastMessageTime, unreadCount);
  });

  ipcMain.handle('db:update-chat-mute', async (event, chatId, muteChat, mutedBy) => {
    return messageDb.updateChatMute(chatId, muteChat, mutedBy);
  });

  ipcMain.handle('db:delete-chat', async (event, chatId) => {
    return messageDb.deleteChat(chatId);
  });

  
}

module.exports = { setupIpcHandlers };
