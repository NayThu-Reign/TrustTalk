import { fetchWithAuth } from '../hooks/fetchWithAuth';

const api = import.meta.env.VITE_API_URL;
const token = localStorage.getItem('token');

/**
 * Service for message-related API operations
 */
export const messageService = {
  /**
   * Send a new message
   */
  async sendMessage(formData) {
    const response = await fetchWithAuth(`${api}/api/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.status === 201) {
      return await response.json();
    }
    throw new Error('Failed to send message');
  },

  /**
   * Edit an existing message
   */
  async editMessage(messageId, textContent) {
    const response = await fetchWithAuth(`${api}/api/messages/${messageId}/edit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text_content: textContent })
    });

    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to edit message');
  },

  /**
   * Delete a message for everyone
   */
  async deleteMessage(chatId, messageId) {
    const response = await fetchWithAuth(`${api}/api/messages/${chatId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ messageId })
    });

    if (response.ok) {
      return true;
    }
    throw new Error('Failed to delete message');
  },

  /**
   * Delete a message for self only
   */
  async deleteMessageForSelf(messageId) {
    const response = await fetchWithAuth(`${api}/api/messages/${messageId}/deleteForSelf`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      return true;
    }
    throw new Error('Failed to delete message for self');
  },

  /**
   * Pin a message
   */
  async pinMessage(messageId) {
    const response = await fetchWithAuth(`${api}/api/messages/pin/${messageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (data.status === 1) {
      return data;
    }
    throw new Error('Failed to pin message');
  },

  /**
   * Unpin a message
   */
  async unpinMessage(messageId) {
    const response = await fetchWithAuth(`${api}/api/messages/unpin/${messageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      return true;
    }
    throw new Error('Failed to unpin message');
  },

  /**
   * Mark messages as read
   */
  async markAsRead(messageIds) {
    const response = await fetchWithAuth(`${api}/api/messages/markRead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ messageIds: messageIds.map(Number) }),
    });

    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to mark messages as read');
  },

  /**
   * Add or update a reaction
   */
  async addReaction(messageId, reactionType) {
    const response = await fetchWithAuth(`${api}/api/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        messageId,
        reactionType,
      }),
    });

    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to add reaction');
  },

  /**
   * Remove a reaction
   */
  async removeReaction(messageId) {
    const response = await fetchWithAuth(`${api}/api/reactions`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        messageId,
      }),
    });

    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to remove reaction');
  },
};

