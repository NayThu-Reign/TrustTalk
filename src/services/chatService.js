const API_URL = import.meta.env.VITE_API_URL;

class ChatService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  async fetchChat(chatId) {
    if (!chatId) return null;

    const response = await fetch(`${API_URL}/api/chats/${chatId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chat: ${response.status}`);
    }

    return await response.json();
  }

  async fetchUser(staffCode) {
    if (!staffCode) return null;

    const response = await fetch(`https://portal.trustlinkmm.com/api/getEmployeeByStaffCode`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ staff_code: staffCode })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    const data = await response.json();
    return data.staffs[0];
  }

  async sendMessage(chatId, message) {
    const response = await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status}`);
    }

    return await response.json();
  }

  async updateMessage(chatId, messageId, updates) {
    const response = await fetch(`${API_URL}/api/chats/${chatId}/messages/${messageId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`Failed to update message: ${response.status}`);
    }

    return await response.json();
  }

  async deleteMessage(chatId, messageId) {
    const response = await fetch(`${API_URL}/api/chats/${chatId}/messages/${messageId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to delete message: ${response.status}`);
    }
  }

  async addReaction(chatId, messageId, reaction) {
    const response = await fetch(`${API_URL}/api/chats/${chatId}/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(reaction)
    });

    if (!response.ok) {
      throw new Error(`Failed to add reaction: ${response.status}`);
    }

    return await response.json();
  }

  async removeReaction(chatId, messageId, userId) {
    const response = await fetch(`${API_URL}/api/chats/${chatId}/messages/${messageId}/reactions/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to remove reaction: ${response.status}`);
    }
  }

  async pinMessage(chatId, messageId, isPinned) {
    const response = await fetch(`${API_URL}/api/chats/${chatId}/messages/${messageId}/pin`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ isPinned })
    });

    if (!response.ok) {
      throw new Error(`Failed to pin message: ${response.status}`);
    }

    return await response.json();
  }
}

export const chatService = new ChatService();
