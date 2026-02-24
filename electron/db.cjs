const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class MessageDatabase {
  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'messages.db');
    this.db = new Database(dbPath);
    this.initTables();
  }

  initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY,
        chat_id INTEGER NOT NULL,
        sender_id TEXT NOT NULL,
        recipient_id TEXT,
        text_content TEXT,
        media_url TEXT,
        media_type TEXT,
        pin INTEGER DEFAULT 0,
        viewed_by TEXT DEFAULT '[]',
        read INTEGER DEFAULT 0,
        reply_to INTEGER,
        edited INTEGER DEFAULT 0,
        deleted_by TEXT,
        is_deleted_for_everyone INTEGER DEFAULT 0,
        deleted_by_user_id TEXT,
        forwarded_from INTEGER,
        mentions TEXT DEFAULT '[]',
        ciphertext TEXT,
        nonce TEXT,
        sender_public_key TEXT,
        key_version INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        
        decryptedUrl TEXT,
        sender_data TEXT,
        original_message TEXT,
        reactions TEXT DEFAULT '[]',
        poll_data TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_chat_id 
        ON messages(chat_id);
      
      CREATE INDEX IF NOT EXISTS idx_created_at 
        ON messages(created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_sender 
        ON messages(sender_id);

      CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY,
        name TEXT,
        is_group_chat INTEGER DEFAULT 0,
        description TEXT,
        photo TEXT,
        mute_chat INTEGER DEFAULT 0,
        muted_by TEXT DEFAULT '[]',
        last_message_time INTEGER,
        unread_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
      
      chatKey TEXT,
    
      lastDecryptedMessage TEXT,
      participants TEXT DEFAULT '[]'
      );

      CREATE INDEX IF NOT EXISTS idx_last_message_time 
        ON chats(last_message_time DESC);
      
      CREATE INDEX IF NOT EXISTS idx_updated_at 
        ON chats(updated_at DESC);

      -- Background fetch tracking table
      CREATE TABLE IF NOT EXISTS background_fetch_status (
        chat_id INTEGER PRIMARY KEY,
        is_fetching INTEGER DEFAULT 0,
        total_fetched INTEGER DEFAULT 0,
        last_fetch_time INTEGER,
        is_complete INTEGER DEFAULT 0,
        FOREIGN KEY(chat_id) REFERENCES chats(id)
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
        id UNINDEXED,
        text_content,
        sender_id,
        content='messages',
        content_rowid='rowid'
      );

      CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
        INSERT INTO messages_fts(rowid, id, text_content, sender_id)
        VALUES (new.rowid, new.id, new.text_content, new.sender_id);
      END;

      CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
        DELETE FROM messages_fts WHERE rowid = old.rowid;
      END;

      CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
        UPDATE messages_fts 
        SET text_content = new.text_content, sender_id = new.sender_id
        WHERE rowid = old.rowid;
      END;
    `);
  }

  // ==================== MESSAGE METHODS ====================

  insertMessage(message) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO messages 
      (id, chat_id, sender_id, recipient_id, text_content, media_url, media_type,
       pin, viewed_by, read, reply_to, edited, deleted_by, is_deleted_for_everyone,
       deleted_by_user_id, forwarded_from, mentions, ciphertext, nonce, 
       sender_public_key, key_version, created_at, updated_at,
       decryptedUrl, sender_data, original_message, reactions, poll_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      message.id,
      message.chat_id,
      message.sender_id,
      message.recipient_id || null,
      message.text_content || null,
      message.media_url || null,
      message.media_type || null,
      message.pin ? 1 : 0,
      typeof message.viewed_by === 'string' ? message.viewed_by : JSON.stringify(message.viewed_by || []),
      message.read ? 1 : 0,
      message.reply_to || null,
      message.edited ? 1 : 0,
      message.deleted_by || null,
      message.is_deleted_for_everyone ? 1 : 0,
      message.deleted_by_user_id || null,
      message.forwarded_from || null,
      typeof message.mentions === 'string' ? message.mentions : JSON.stringify(message.mentions || []),
      message.ciphertext || null,
      message.nonce || null,
      message.sender_public_key || null,
      message.key_version || 1,
      message.created_at || Date.now(),
      message.updated_at || Date.now(),
      message.decryptedUrl || null,
      message.sender ? JSON.stringify(message.sender) : null,
      message.originalMessage ? JSON.stringify(message.originalMessage) : null,
      message.reactions ? JSON.stringify(message.reactions) : '[]',
      message.Poll ? JSON.stringify(message.Poll) : null
    );
  }

  insertMessages(messages) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO messages 
      (id, chat_id, sender_id, recipient_id, text_content, media_url, media_type,
       pin, viewed_by, read, reply_to, edited, deleted_by, is_deleted_for_everyone,
       deleted_by_user_id, forwarded_from, mentions, ciphertext, nonce, 
       sender_public_key, key_version, created_at, updated_at,
       decryptedUrl, sender_data, original_message, reactions, poll_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((messages) => {
      for (const msg of messages) {
        stmt.run(
          msg.id,
          msg.chat_id,
          msg.sender_id,
          msg.recipient_id || null,
          msg.text_content || null,
          msg.media_url || null,
          msg.media_type || null,
          msg.pin ? 1 : 0,
          typeof msg.viewed_by === 'string' ? msg.viewed_by : JSON.stringify(msg.viewed_by || []),
          msg.read ? 1 : 0,
          msg.reply_to || null,
          msg.edited ? 1 : 0,
          msg.deleted_by || null,
          msg.is_deleted_for_everyone ? 1 : 0,
          msg.deleted_by_user_id || null,
          msg.forwarded_from || null,
          typeof msg.mentions === 'string' ? msg.mentions : JSON.stringify(msg.mentions || []),
          msg.ciphertext || null,
          msg.nonce || null,
          msg.sender_public_key || null,
          msg.key_version || 1,
          msg.created_at || Date.now(),
          msg.updated_at || Date.now(),
          msg.decryptedUrl || null,
          msg.sender ? JSON.stringify(msg.sender) : null,
          msg.originalMessage ? JSON.stringify(msg.originalMessage) : null,
          msg.reactions ? JSON.stringify(msg.reactions) : '[]',
          msg.Poll ? JSON.stringify(msg.Poll) : null
        );
      }
    });

    return insertMany(messages);
  }

  getMessages(chatId, limit = 50, offset = 0) {
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE chat_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    
    return stmt.all(chatId, limit, offset).map(row => this.parseMessage(row)).reverse();
  }

  // ✅ NEW: Get message count for a chat
  getMessageCount(chatId) {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM messages WHERE chat_id = ?
    `);
    const result = stmt.get(chatId);
    return result?.count || 0;
  }

  // ✅ NEW: Get a single message by ID
  getMessageById(messageId) {
    const stmt = this.db.prepare(`
      SELECT * FROM messages WHERE id = ?
    `);
    const row = stmt.get(messageId);
    return row ? this.parseMessage(row) : null;
  }

  // ✅ NEW: Get messages around a specific timestamp (for loading context)
  getMessagesAroundTimestamp(chatId, timestamp, limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE chat_id = ?
      ORDER BY ABS(created_at - ?) ASC
      LIMIT ?
    `);
    
    return stmt.all(chatId, timestamp, limit).map(row => this.parseMessage(row));
  }

  // ✅ NEW: Get oldest message timestamp for a chat
  getOldestMessageTime(chatId) {
    const stmt = this.db.prepare(`
      SELECT MIN(created_at) as oldest FROM messages WHERE chat_id = ?
    `);
    const result = stmt.get(chatId);
    return result?.oldest || null;
  }

  searchMessages(query, chatId = null, limit = 50) {
    const ftsQuery = query.split(' ')
      .filter(word => word.trim())
      .map(word => `${word}*`)
      .join(' OR ');

    let sql = `
      SELECT m.*, 
             snippet(messages_fts, 1, '<mark>', '</mark>', '...', 32) as snippet,
             rank
      FROM messages_fts
      JOIN messages m ON messages_fts.rowid = m.rowid
      WHERE messages_fts MATCH ?
    `;
    
    const params = [ftsQuery];
    
    if (chatId) {
      sql += ` AND m.chat_id = ?`;
      params.push(chatId);
    }
    
    sql += ` ORDER BY rank LIMIT ?`;
    params.push(limit);
    
    try {
      const stmt = this.db.prepare(sql);
      const results = stmt.all(...params);
      return results.map(row => this.parseMessage(row));
    } catch (error) {
      console.error('SQLite FTS search error:', error);
      return this.simpleLikeSearch(query, chatId, limit);
    }
  }

  simpleLikeSearch(query, chatId = null, limit = 50) {
    let sql = `
      SELECT * FROM messages 
      WHERE text_content LIKE ?
    `;
    
    const params = [`%${query}%`];
    
    if (chatId) {
      sql += ` AND chat_id = ?`;
      params.push(chatId);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);
    
    const stmt = this.db.prepare(sql);
    return stmt.all(...params).map(row => this.parseMessage(row));
  }

  advancedSearch({ query, chatId, senderId, mediaType, startDate, endDate, limit = 50 }) {
    let sql = `
      SELECT m.* FROM messages m
      WHERE 1=1
    `;
    
    const params = [];
    
    if (query) {
      sql += ` AND m.text_content LIKE ?`;
      params.push(`%${query}%`);
    }
    
    if (chatId) {
      sql += ` AND m.chat_id = ?`;
      params.push(chatId);
    }
    
    if (senderId) {
      sql += ` AND m.sender_id = ?`;
      params.push(senderId);
    }
    
    if (mediaType) {
      sql += ` AND m.media_type = ?`;
      params.push(mediaType);
    }
    
    if (startDate) {
      sql += ` AND m.created_at >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND m.created_at <= ?`;
      params.push(endDate);
    }
    
    sql += ` ORDER BY m.created_at DESC LIMIT ?`;
    params.push(limit);
    
    const stmt = this.db.prepare(sql);
    return stmt.all(...params).map(row => this.parseMessage(row));
  }

  parseMessage(row) {
    return {
      ...row,
      pin: Boolean(row.pin),
      read: Boolean(row.read),
      edited: Boolean(row.edited),
      is_deleted_for_everyone: Boolean(row.is_deleted_for_everyone),
      viewed_by: row.viewed_by ? JSON.parse(row.viewed_by) : [],
      mentions: row.mentions ? JSON.parse(row.mentions) : [],
      sender: row.sender_data ? JSON.parse(row.sender_data) : null,
      originalMessage: row.original_message ? JSON.parse(row.original_message) : null,
      reactions: row.reactions ? JSON.parse(row.reactions) : [],
      Poll: row.poll_data ? JSON.parse(row.poll_data) : null,
    };
  }

  deleteOldMessages(daysToKeep = 90) {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const stmt = this.db.prepare('DELETE FROM messages WHERE created_at < ?');
    return stmt.run(cutoffDate);
  }

  // ==================== BACKGROUND FETCH STATUS METHODS ====================

  // ✅ NEW: Get background fetch status
  getBackgroundFetchStatus(chatId) {
    const stmt = this.db.prepare(`
      SELECT * FROM background_fetch_status WHERE chat_id = ?
    `);
    const result = stmt.get(chatId);
    if (!result) return null;
    
    return {
      ...result,
      is_fetching: Boolean(result.is_fetching),
      is_complete: Boolean(result.is_complete),
    };
  }

  // ✅ NEW: Update background fetch status
  updateBackgroundFetchStatus(chatId, updates) {
    const existing = this.getBackgroundFetchStatus(chatId);
    
    if (!existing) {
      // Insert new record
      const stmt = this.db.prepare(`
        INSERT INTO background_fetch_status 
        (chat_id, is_fetching, total_fetched, last_fetch_time, is_complete)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      return stmt.run(
        chatId,
        updates.is_fetching ? 1 : 0,
        updates.total_fetched || 0,
        updates.last_fetch_time || Date.now(),
        updates.is_complete ? 1 : 0
      );
    } else {
      // Update existing record
      const fields = [];
      const values = [];
      
      if (updates.is_fetching !== undefined) {
        fields.push('is_fetching = ?');
        values.push(updates.is_fetching ? 1 : 0);
      }
      
      if (updates.total_fetched !== undefined) {
        fields.push('total_fetched = ?');
        values.push(updates.total_fetched);
      }
      
      if (updates.last_fetch_time !== undefined) {
        fields.push('last_fetch_time = ?');
        values.push(updates.last_fetch_time);
      }
      
      if (updates.is_complete !== undefined) {
        fields.push('is_complete = ?');
        values.push(updates.is_complete ? 1 : 0);
      }
      
      values.push(chatId);
      
      const stmt = this.db.prepare(`
        UPDATE background_fetch_status 
        SET ${fields.join(', ')}
        WHERE chat_id = ?
      `);
      
      return stmt.run(...values);
    }
  }

  // ✅ NEW: Reset background fetch status
  resetBackgroundFetchStatus(chatId) {
    const stmt = this.db.prepare(`
      DELETE FROM background_fetch_status WHERE chat_id = ?
    `);
    return stmt.run(chatId);
  }

  // ==================== CHAT METHODS ====================

  insertChat(chat) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO chats 
      (id, name, is_group_chat, description, photo, mute_chat, muted_by, 
       last_message_time, unread_count, created_at, updated_at,
       chatKey, lastDecryptedMessage, participants)    
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = Date.now();
    
    return stmt.run(
      chat.id,
      chat.name || null,
      chat.is_group_chat ? 1 : 0,
      chat.description || null,
      chat.photo || null,
      chat.mute_chat ? 1 : 0,
      typeof chat.muted_by === 'string' ? chat.muted_by : JSON.stringify(chat.muted_by || []),
      chat.last_message_time || now,
      chat.unread_count || 0,
      chat.created_at || now,
      chat.updated_at || now,
      chat.chatKey ? JSON.stringify(chat.chatKey) : null,
      chat.lastDecryptedMessage ? JSON.stringify(chat.lastDecryptedMessage) : null,
      chat.participants ? JSON.stringify(chat.participants) : '[]'
    );
  }


  // ✅ NEW: Batch insert chats (transaction for performance)
  insertChats(chats) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO chats 
      (id, name, is_group_chat, description, photo, mute_chat, muted_by, 
       last_message_time, unread_count, created_at, updated_at,
       chatKey, lastDecryptedMessage, participants)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((chats) => {
      for (const chat of chats) {
        const now = Date.now();
        stmt.run(
          chat.id,
          chat.name || null,
          chat.is_group_chat ? 1 : 0,
          chat.description || null,
          chat.photo || null,
          chat.mute_chat ? 1 : 0,
          typeof chat.muted_by === 'string' ? chat.muted_by : JSON.stringify(chat.muted_by || []),
          chat.last_message_time || now,
          chat.unread_count || 0,
          chat.created_at || now,
          chat.updated_at || now,
          chat.chatKey ? JSON.stringify(chat.chatKey) : null,
          chat.lastDecryptedMessage ? JSON.stringify(chat.lastDecryptedMessage) : null,
          chat.participants ? JSON.stringify(chat.participants) : '[]'
        );
      }
    });

    return insertMany(chats);
  }

  getChats(limit = 100, offset = 0) {
    const stmt = this.db.prepare(`
      SELECT * FROM chats 
      ORDER BY last_message_time DESC
      LIMIT ? OFFSET ?
    `);
    
    return stmt.all(limit, offset).map(row => this.parseChat(row));
  }

  getChat(chatId) {
    const stmt = this.db.prepare(`
      SELECT * FROM chats WHERE id = ?
    `);
    
    const row = stmt.get(chatId);
    return row ? this.parseChat(row) : null;
  }

  upsertChat(chat) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO chats 
      (id, name, is_group_chat, description, photo, mute_chat, muted_by, 
       last_message_time, unread_count, created_at, updated_at,
       chatKey, lastDecryptedMessage, participants)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = Date.now();
    
    return stmt.run(
      chat.id,
      chat.name || null,
      chat.is_group_chat ? 1 : 0,
      chat.description || null,
      chat.photo || null,
      chat.mute_chat ? 1 : 0,
      typeof chat.muted_by === 'string' ? chat.muted_by : JSON.stringify(chat.muted_by || []),
      chat.last_message_time || now,
      chat.unread_count || 0,
      chat.created_at || now,
      chat.updated_at || now,
      chat.chatKey ? JSON.stringify(chat.chatKey) : null,
      chat.lastDecryptedMessage ? JSON.stringify(chat.lastDecryptedMessage) : null,
      chat.participants ? JSON.stringify(chat.participants) : '[]'
    );
  }

  updateChatLastMessageTime(chatId, lastMessageTime, unreadCount = null) {
    let sql = `
      UPDATE chats 
      SET last_message_time = ?, updated_at = ?
    `;
    
    const params = [lastMessageTime, Date.now()];
    
    if (unreadCount !== null) {
      sql += `, unread_count = ?`;
      params.push(unreadCount);
    }
    
    sql += ` WHERE id = ?`;
    params.push(chatId);
    
    const stmt = this.db.prepare(sql);
    return stmt.run(...params);
  }

  // Add this method to your messageDb class/object

updateChatLastMessage(chatId, lastMessage) {
  const lastMessageTime = lastMessage?.createdAt 
    ? new Date(lastMessage.createdAt).getTime() 
    : Date.now();

  const stmt = this.db.prepare(`
    UPDATE chats 
    SET last_message_time = ?, 
        lastDecryptedMessage = ?,
        updated_at = ?
    WHERE id = ?
  `);
  
  return stmt.run(
    lastMessageTime,
    JSON.stringify(lastMessage),
    Date.now(),
    chatId
  );
}

  updateChatMute(chatId, muteChat, mutedBy) {
    const stmt = this.db.prepare(`
      UPDATE chats 
      SET mute_chat = ?, 
          muted_by = ?,
          updated_at = ?
      WHERE id = ?
    `);
    
    return stmt.run(
      muteChat ? 1 : 0,
      typeof mutedBy === 'string' ? mutedBy : JSON.stringify(mutedBy || []),
      Date.now(),
      chatId
    );
  }

  deleteChat(chatId) {
    const stmt = this.db.prepare('DELETE FROM chats WHERE id = ?');
    return stmt.run(chatId);
  }

  parseChat(row) {
    return {
      ...row,
      is_group_chat: Boolean(row.is_group_chat),
      mute_chat: Boolean(row.mute_chat),
      muted_by: row.muted_by ? JSON.parse(row.muted_by) : [],
      chatKey: row.chatKey,
      lastDecryptedMessage: row.lastDecryptedMessage ? JSON.parse(row.lastDecryptedMessage) : null,
      participants: row.participants ? JSON.parse(row.participants) : []
    };
  }

  migrateMetadataToColumns() {
    const chats = this.db.prepare('SELECT * FROM chats').all();
    
    this.db.exec(`
      ALTER TABLE chats ADD COLUMN chatKey TEXT;
      ALTER TABLE chats ADD COLUMN lastDecryptedMessage TEXT;
      ALTER TABLE chats ADD COLUMN participants TEXT DEFAULT '[]';
    `);
    
    const updateStmt = this.db.prepare(`
      UPDATE chats 
      SET 
          chatKey = ?,
          lastDecryptedMessage = ?,
          participants = ?
      WHERE id = ?
    `);
    
    for (const chat of chats) {
      if (chat.metadata) {
        const metadata = JSON.parse(chat.metadata);
        updateStmt.run(
          JSON.stringify(metadata.chatKey),
          metadata.lastDecryptedMessage ? JSON.stringify(metadata.lastDecryptedMessage) : null,
          metadata.participants ? JSON.stringify(metadata.participants) : '[]',
          chat.id
        );
      }
    }
  }

  close() {
    this.db.close();
  }
}

module.exports = new MessageDatabase();
