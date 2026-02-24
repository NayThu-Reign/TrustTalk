// src/components/NotificationHandler.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useUIState } from '../providers/UIStateProvider';
import { useChats } from '../providers/ChatsProvider';
import { decryptInWorker } from '../crypto/cryptoClient';
import { encryptId } from '../lib/crypto';
import { ToastContainer } from './ToastNotification';


export default function NotificationHandler() {
  const { authUser, isTabActiveRef } = useAuth();
  const { socket, users } = useChats();
  const { activeChatId, setActiveChatId } = useUIState();
  
  const activeChatIdRef = useRef(activeChatId);
  const [toastNotifications, setToastNotifications] = useState([]);
  const [unreadMentions, setUnreadMentions] = useState({});
  const navigate = useNavigate();
  
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  /* -------------------- Notification Permission -------------------- */
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  /* -------------------- Service Worker Click -------------------- */
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'OPEN_CHAT') {
          handleNotificationClick(event.data.chatId, event.data.messageId);
        }
      });
    }
  }, []);

  /* -------------------- Decrypt Helper -------------------- */
  const decryptIncomingMessage = async (chatId, msg) => {
    if (!msg?.ciphertext || !msg?.nonce) return null;

    try {
      return await decryptInWorker({
        chatId,
        ciphertext: msg.ciphertext,
        nonce: msg.nonce,
        version: msg.key_version,
      });
    } catch {
      return null;
    }
  };

  /* -------------------- STRICT @Name, Mention Parsing -------------------- */
  const extractMentionsFromText = (text) => {
    if (!text) return [];

    const regex = /@([^,@]+),/g;
    const mentions = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      mentions.push(match[1].trim());
    }

    return mentions;
  };

  const resolveMentionedUsers = (
    mentionNames,
    users = [],
    participants = []
  ) => {
    console.log("🔎 Mention names:", mentionNames);
    console.log("👥 All users:", users);
    console.log("🧑‍🤝‍🧑 Chat participants:", participants);

    // ✅ @All, or @Everyone,
    const isMentionAll = mentionNames.some((name) =>
      ["all", "everyone"].includes(name.toLowerCase())
    );

    if (isMentionAll) {
      console.log("📢 Mention ALL participants");
      return participants;
    }

    // ✅ Normal mentions → resolve from global users
    const matchedUsers = users.filter((u) =>
      mentionNames.some(
        (name) =>
          u.username?.trim().toLowerCase() ===
          name.trim().toLowerCase()
      )
    );

    console.log("✅ Resolved mentioned users:", matchedUsers);
    return matchedUsers;
  };

  /* -------------------- Socket Message Handler -------------------- */
  useEffect(() => {
    const handleNewMessage = async (data) => {
      const { newMessage, sender, notiChat } = data;
      console.log("📩 New incoming message for notification:", data);

      const participantIds =
        notiChat?.participants?.map((p) => p.employeeId) || [];

      if (
        !participantIds.includes(authUser.user_code) ||
        sender.user_code === authUser.user_code ||
        notiChat?.muted_by?.includes(authUser.user_code)
      ) {
        return;
      }

      // 🔓 decrypt first
      const decryptedText = await decryptIncomingMessage(
        notiChat.id,
        newMessage
      );

      newMessage.text_content = decryptedText;

      // 🔍 mention detection
      const mentionNames = extractMentionsFromText(decryptedText);
      const mentionedUsers = resolveMentionedUsers(
        mentionNames,
        users,
        notiChat.participants || []
      );

      const isMention = mentionedUsers.some(
        (u) => (u.user_code || u.employeeId) == authUser.user_code
      );

      const isCurrentChat = activeChatIdRef.current == notiChat.id;
      const isTabActive = isTabActiveRef.current;

      // ✅ Show in-app toast if tab is active OR on the current chat
      if (isTabActive && isCurrentChat) {
        showToastNotification(newMessage, sender, notiChat, isMention);
      } else {
        // ✅ Show native notification if tab is not active
        showNativeNotification(newMessage, sender, notiChat, isMention);
      }
    };

    socket.on('notiMessage', handleNewMessage);
    return () => socket.off('notiMessage', handleNewMessage);
  }, [authUser, users]);

  /* -------------------- Show In-App Toast -------------------- */
  const showToastNotification = (message, sender, notiChat, isMention) => {
    const notificationId = Date.now();
    
    setToastNotifications((prev) => [
      ...prev,
      {
        id: notificationId,
        message,
        sender,
        notiChat,
        isMention,
      },
    ]);

    // Auto-dismiss after 5 seconds (8 seconds for mentions)
    setTimeout(() => {
      removeToastNotification(notificationId);
    }, isMention ? 8000 : 5000);
  };

  const removeToastNotification = (notificationId) => {
    setToastNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );
  };

  const handleToastClick = (notification) => {
    handleNotificationClick(notification.notiChat.id, notification.message.id);
    removeToastNotification(notification.id);
  };

  /* -------------------- Show Native Notification -------------------- */
  const showNativeNotification = async (message, sender, notiChat, isMention) => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const title = isMention
      ? `🔔 Mentioned by ${sender.username}`
      : `💬 ${sender.username}${
          notiChat.name ? ` in ${notiChat.name}` : ''
        }`;

    // ✅ Get icon path from Electron (async)
    let iconPath = '';
    try {
      if (window.chat?.getAssetPath) {
        iconPath = await window.chat.getAssetPath('splash_logo_tl_2.png');
      }
    } catch (error) {
      console.error('Failed to get asset path:', error);
    }

    const options = {
      body: isMention
      ? 'Click to view the mention'
      : message.text_content || '📎 Media message',
      icon: '/splash.webp',
      tag: `chat-${notiChat.id}`,
      silent: false,
      data: {
        chatId: notiChat.id,
        messageId: message.id,
      },
    };

    const notification = new Notification(title, options);
    

    notification.onclick = () => {
      handleNotificationClick(notiChat.id, message.id);
    };
  };

  /* -------------------- Click Handler -------------------- */
  const handleNotificationClick = (chatId, messageId) => {
    window.focus();
    const encryptedId = encodeURIComponent(encryptId(chatId));
    navigate(`/conversation/c/${encryptedId}`);

    setTimeout(() => {
      const el = document.getElementById(`message-${messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        el.classList.add('mention-highlight');
      }
    }, 500);
  };

  /* -------------------- Badge Counter (optional) -------------------- */
  const updateMentionBadge = (chatId) => {
    setUnreadMentions((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] || 0) + 1,
    }));
  };

  return (
    <ToastContainer
      notifications={toastNotifications}
      onClose={removeToastNotification}
      onNotificationClick={handleToastClick}
    />
  );
}
