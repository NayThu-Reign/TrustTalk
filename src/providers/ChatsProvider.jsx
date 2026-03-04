
import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useReducer } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthProvider';
import { useUIState } from './UIStateProvider';
// import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";

import { fetchWithAuth } from '../hooks/fetchWithAuth';


import { getDB } from '../utils/signalStore';

import sodium from "libsodium-wrappers";
import { decryptInWorker } from '../crypto/cryptoClient';
import { createKeyBackupFile } from '../utils/createKeybackupFile';
import { restoreFromKeybackupFile } from "../utils/restoreKeybackup";
import ms from 'ms';
import { useParams } from 'react-router-dom';
import { decryptId } from '../lib/crypto';








// import { useQuery, useQueryClient } from '@tanstack/react-query';

const ChatsContext = createContext();
export const useChats = () => useContext(ChatsContext);

const decryptedImageCache = new Map();
const decryptedMediaCache = new Map();

export default function ChatsProvider({children }) {

  const { activeChatId, setActiveChatId } = useUIState();
  const [chatId, setChatId] = useState(null);
 

  const activeChatIdRef = useRef(activeChatId);

useEffect(() => {
  activeChatIdRef.current = activeChatId;
}, [activeChatId]);

const updateMessageArray = (messages, messageId, updater) =>
  messages.map(m => (m.id === messageId ? updater(m) : m));

const ensureMessageExists = (messages, message) =>
  messages.some(m => m.id === message.id)
    ? messages
    : [...messages, message];


 
  const initialState = {
    chats: [],
    chat: null,
  
    // standalone current-chat messages
    messages: [],
  
    sharedFiles: [],
    files: [],
    sharedMedias: [],
    medias: [],
  
    pinnedMessage: null,
  };

  function chatsReducer(state, action) {
    switch (action.type) {
      case "SET_CHATS":
        return { ...state, chats: action.payload };
  
      case "SET_CHAT":
        return { ...state, chat: action.payload };

      case "SET_CHAT_DATA":
        console.log("SET_CHAT_DATA action.payload", action.payload);
          return {
            ...state,
            messages: action.payload.messages,
            pinnedMessage: action.payload.pinnedMessage,
    
            sharedFiles: action.payload.sharedFiles || [],
            files: action.payload.files || [],
            sharedMedias: action.payload.sharedMedias || [],
            medias: action.payload.medias || [],
          };
    
  
      case "RESET_CHAT":
        return {
          ...state,
          chat: null,
          messages: [],
          sharedFiles: [],
          files: [],
          sharedMedias: [],
          medias: [],
          pinnedMessage: null,
        };
  
      case "SET_MESSAGES": {
        const messages = action.payload ?? [];
        const medias = messages.filter(m => ["image", "gif", "sticker"].includes(m?.media_type));
        const files = messages.filter(m => m?.media_type === "file");
        return {
          ...state,
          messages,
          // sharedMedias: medias.slice(-3),
          // medias,
          // sharedFiles: files.slice(-5),
          // files,
        };
      }
  
      case "APPEND_MESSAGE":
        return {
          ...state,
          messages: [...state.messages, action.payload],
        };
  
      case "DELETE_MESSAGE":
        return {
          ...state,
          messages: state.messages.map((m) =>
            m.id === action.payload.messageId
              ? {
                  ...m,
                  text_content: null,
                  media_url: null,
                  media_type: null,
                  deletedByUser: action.payload.deletedByUser,
                  deleted_by_user_id: action.payload.deletedByUserId,
                }
              : m
          ),
        };
  
      case "SET_MEDIA_DERIVED": {
        const p = action.payload || {};
        return {
          ...state,
          sharedMedias: p.sharedMedias ?? state.sharedMedias ?? [],
          medias: p.medias ?? state.medias ?? [],
          sharedFiles: p.sharedFiles ?? state.sharedFiles ?? [],
          files: p.files ?? state.files ?? [],
        };
      }

        case "UPSERT_CHAT_WITH_MESSAGE": {
          const { chatId, message, chatData } = action.payload;

          console.log("UPSERT_CHAT_WITH_MESSAGE action.payload", chatData);
        
          const chats = [...state.chats];
          const index = chats.findIndex(c => c.id == chatId);
        
          let updatedChat;
        
          if (index != -1) {
            updatedChat = {
              ...chats[index],
              messages: [...(chats[index].messages || []), message],
              updatedAt: message.createdAt,
              lastDecryptedMessage: message,
            };
            chats.splice(index, 1);
          } else if (chatData) {
            updatedChat = {
              ...chatData,
              messages: [message],
              lastDecryptedMessage: message,
            };
          } else {
            return state;
          }
        
          chats.unshift(updatedChat);
        
          return {
            ...state,
            chats,
          };
        }
              
      case "APPEND_ACTIVE_MESSAGE":
        return {
          ...state,
          messages: [...state.messages, action.payload],
        };
      
      case "APPEND_MEDIA":
          return {
            ...state,
            files:
              action.payload.media_type === "file"
                ? [...state.files, action.payload]
                : state.files,
        
            sharedFiles:
              action.payload.media_type === "file"
                ? [...state.sharedFiles.slice(-3), action.payload]
                : state.sharedFiles,
        
            medias:
              ["image", "gif"].includes(action.payload.media_type)
                ? [...state.medias, action.payload]
                : state.medias,
        
            sharedMedias:
              ["image", "gif"].includes(action.payload.media_type)
                ? [...state.sharedMedias.slice(-2), action.payload]
                : state.sharedMedias,
          };
      
      case "SET_PINNED_MESSAGE":
        return {
          ...state,
          pinnedMessage: action.payload,
        };

      case "CLEAR_PINNED_MESSAGE":
        return {
          ...state,
          pinnedMessage: null,
        };
        
      case "PIN_MESSAGE": {
  const { chatId, message, pinMessageId } = action.payload;

  console.log("PIN_MESSAGE action.payload", pinMessageId);
  
  return {
    ...state,
    chats: state.chats.map(chat => {
      if (chat.id !== chatId) return chat;

      const messages = [...(chat.messages || [])];
      
      // Unpin any existing pinned message
      const existingPinnedIndex = messages.findIndex(m => m.pin === true || m.pin === 1);
      if (existingPinnedIndex !== -1) {
        messages[existingPinnedIndex] = { ...messages[existingPinnedIndex], pin: false };
      }
      
      // Find and pin the target message
      const msgIndex = messages.findIndex(m => m.id === pinMessageId);

      if (msgIndex !== -1) {
        messages[msgIndex] = { ...messages[msgIndex], pin: true };
      } else {
        messages.push({ ...message, pin: true });
      }

      return {
        ...chat,
        messages,
        updatedAt: message.createdAt,
        lastDecryptedMessage: message,
      };
    }),
    
     messages:
              action.payload.chatId == activeChatIdRef.current
                ? [
                    ...state.messages.map(msg =>
                      msg.id == action.payload.pinMessageId
                        ? { ...msg, pin: true }
                        : msg
                    ),
                    // Add new message if it doesn't exist
                    ...(!state.messages.find(m => m.id == action.payload.message.id)
                      ? [action.payload.message]
                      : []),
                  ]
                : state.messages,
    
    // Update pinnedMessage if it's for the active chat
    pinnedMessage:
      chatId == activeChatIdRef.current
        ? state.messages.find(m => m.id == pinMessageId)
        : state.pinnedMessage,
  };
}

case "UNPIN_MESSAGE": {
  const { chatId, pinMessageId } = action.payload;
  
  return {
    ...state,
    chats: state.chats.map(chat => {
      if (chat.id !== chatId) return chat;

      const messages = [...(chat.messages || [])];
      const msgIndex = messages.findIndex(m => m.id === pinMessageId);

      if (msgIndex !== -1) {
        messages[msgIndex] = { ...messages[msgIndex], pin: false };
      }

      return {
        ...chat,
        messages,
      };
    }),
    
    messages:
              action.payload.chatId == activeChatIdRef.current
                ? [
                    ...state.messages.map(msg =>
                      msg.id == action.payload.pinMessageId
                        ? { ...msg, pin: false }
                        : msg
                    ),
                    // Add new message if it doesn't exist
                    ...(!state.messages.find(m => m.id == action.payload.message.id)
                      ? [action.payload.message]
                      : []),
                  ]
                : state.messages,
    
    // Clear pinnedMessage if it's for the active chat
    pinnedMessage:
      chatId == activeChatIdRef.current
        ? null
        : state.pinnedMessage,
  };
}
      
            
            case "MESSAGE_DELETED": {
              const { chatId, messageId, meta } = action.payload;

              console.log("chatId", chatId);
            
              return {
                ...state,
            
                chats: state.chats.map(chat => {
                  console.log("chatState", chat);
                  if (chat.id != chatId) return chat;

                  console.log("chat.lastDecryptedMessage", chat.lastDecryptedMessage);
            
                  return {
                    ...chat,
                    messages: updateMessageArray(chat.messages || [], messageId, m => ({
                      ...m,
                      text_content: null,
                      media_url: null,
                      media_type: null,
                      ...meta,
                    })),
                    lastDecryptedMessage:
                      chat.lastDecryptedMessage?.id == messageId
                        ? { ...chat.lastDecryptedMessage, text_content: null, media_url: null }
                        : chat.lastDecryptedMessage,
                  };
                }),
            
                messages:
                  chatId == activeChatIdRef.current
                    ? updateMessageArray(state.messages, messageId, m => ({
                        ...m,
                        text_content: null,
                        media_url: null,
                        media_type: null,
                        is_deleted_for_everyone: true,
                        ...meta,
                      }))
                    : state.messages,
              };
            }
            
            case "MESSAGE_READ": {
              const { chatId, messageId, userId } = action.payload;
            
              const addViewedBy = msg => {
                const viewed = Array.isArray(msg.viewed_by)
                  ? msg.viewed_by
                  : typeof msg.viewed_by === "string"
                  ? (() => {
                      try {
                        return JSON.parse(msg.viewed_by);
                      } catch {
                        return [];
                      }
                    })()
                  : [];
            
                if (viewed.includes(userId)) return msg;
            
                return {
                  ...msg,
                  viewed_by: [...viewed, userId],
                };
              };
            
              return {
                ...state,
            
                // 🔹 Update chats list
                chats: state.chats.map(chat =>
                  chat.id != chatId
                    ? chat
                    : {
                        ...chat,
                        messages: updateMessageArray(
                          chat.messages || [],
                          messageId,
                          addViewedBy
                        ),
                        lastDecryptedMessage:
                          chat.lastDecryptedMessage?.id == messageId
                            ? addViewedBy(chat.lastDecryptedMessage)
                            : chat.lastDecryptedMessage,
                      }
                ),
            
                // 🔹 Update active chat messages
                messages:
                  chatId == activeChatIdRef.current
                    ? updateMessageArray(state.messages, messageId, addViewedBy)
                    : state.messages,
              };
            }
            
            

            case "MESSAGE_UNREAD": {
              const { chatId, messageId, userId } = action.payload;
            
              const updateViewedBy = msg => {
                const viewed = Array.isArray(msg.viewed_by) ? msg.viewed_by : [];
                return { ...msg, viewed_by: viewed.filter(id => id != userId) };
              };
            
              return {
                ...state,
            
                chats: state.chats.map(chat =>
                  chat.id != chatId
                    ? chat
                    : {
                        ...chat,
                        messages: updateMessageArray(chat.messages || [], messageId, updateViewedBy),
                        lastDecryptedMessage:
                          chat.lastDecryptedMessage?.id == messageId
                            ? updateViewedBy(chat.lastDecryptedMessage)
                            : chat.lastDecryptedMessage,
                      }
                ),
            
                messages:
                  chatId == activeChatIdRef.current
                    ? updateMessageArray(state.messages, messageId, updateViewedBy)
                    : state.messages,
              };
            }

            case "REACTION_ADDED": {
              const { reaction } = action.payload;

              console.log("reactionAdded", reaction);
            
              const addReaction = msg => ({
                ...msg,
                reactions: [...(msg.reactions || []), reaction],
              });
            
              let affectedChatId = null;
            
              const chats = state.chats.map(chat => {
                const hasMessage = (chat.messages || []).some(
                  m => m.id == reaction.message_id
                );
            
                if (!hasMessage) return chat;
            
                affectedChatId = chat.id;
            
                return {
                  ...chat,
                  messages: updateMessageArray(
                    chat.messages || [],
                    reaction.message_id,
                    addReaction
                  ),
                };
              });
            
              return {
                ...state,
                chats,
            
                messages:
                  affectedChatId == activeChatIdRef.current
                    ? updateMessageArray(
                        state.messages,
                        reaction.message_id,
                        addReaction
                      )
                    : state.messages,
              };
            }
            

            case "REACTION_REMOVED": {
              const { reaction } = action.payload;
              const { messageId, userId } = reaction;
            
              const removeReaction = msg => ({
                ...msg,
                reactions: (msg.reactions || []).filter(
                  r => r.user_id != userId
                ),
              });
            
              let affectedChatId = null;
            
              const chats = state.chats.map(chat => {
                const hasMessage = (chat.messages || []).some(
                  m => m.id == messageId
                );
            
                if (!hasMessage) return chat;
            
                affectedChatId = chat.id;
            
                return {
                  ...chat,
                  messages: updateMessageArray(
                    chat.messages || [],
                    messageId,
                    removeReaction
                  ),
                };
              });
            
              return {
                ...state,
                chats,
            
                messages:
                  affectedChatId == activeChatIdRef.current
                    ? updateMessageArray(
                        state.messages,
                        messageId,
                        removeReaction
                      )
                    : state.messages,
              };
            }
            

            case "REACTION_UPDATED": {
              const { reaction } = action.payload;
            
              const updateReaction = msg => {
                const reactions = msg.reactions || [];
            
                const exists = reactions.some(
                  r => r.user_id == reaction.user_id
                );
            
                return {
                  ...msg,
                  reactions: exists
                    ? reactions.map(r =>
                        r.user_id == reaction.user_id ? reaction : r
                      )
                    : [...reactions, reaction],
                };
              };
            
              let affectedChatId = null;
            
              const chats = state.chats.map(chat => {
                const hasMessage = (chat.messages || []).some(
                  m => m.id == reaction.message_id
                );
            
                if (!hasMessage) return chat;
            
                affectedChatId = chat.id;
            
                return {
                  ...chat,
                  messages: updateMessageArray(
                    chat.messages || [],
                    reaction.message_id,
                    updateReaction
                  ),
                };
              });
            
              return {
                ...state,
                chats,
            
                messages:
                  affectedChatId == activeChatIdRef.current
                    ? updateMessageArray(
                        state.messages,
                        reaction.message_id,
                        updateReaction
                      )
                    : state.messages,
              };
            }


            case "FORWARD_LAST_MESSAGE": {
              const { message } = action.payload;
              const chatId = message.chat_id;
            
              let affectedChatId = null;
            
              const chats = [...state.chats];
              const index = chats.findIndex(c => c.id == chatId);
            
              if (index === -1) return state;
            
              const chat = chats[index];
            
              const updatedChat = {
                ...chat,
                messages: [...(chat.messages || []), message],
                updatedAt: message.createdAt,
                lastDecryptedMessage: message,
              };
            
              // move chat to top
              chats.splice(index, 1);
              chats.unshift(updatedChat);
            
              return {
                ...state,
                chats,
            
                messages:
                  chatId == activeChatIdRef.current
                    ? [...state.messages, message]
                    : state.messages,
              };
            }

            case "ADD_CHAT_ADMIN": {
              const { chatId, admin } = action.payload;
            
              return {
                ...state,
            
                chat:
                  activeChatIdRef.current == chatId
                    ? (() => {
                        const exists = (state.chat.ownerAdmins || []).some(
                          a => a.user_code === admin.user_code
                        );

                        
            
                        return exists
                          ? state.chat
                          : {
                              ...state.chat,
                              ownerAdmins: [...(state.chat.ownerAdmins || []), admin],
                            };
                      })()
                    : state.chat,
              };
            }
            

            case "REMOVE_PARTICIPANTS": {
              const { chatId, removed, message } = action.payload;
            
              const removedCodes = removed.map(p => p.user_id);
            
              return {
                ...state,
            
                chats: state.chats.map(chat =>
                  chat.id != message.chat_id
                    ? chat
                    : {
                        ...chat,
                        messages: [...(chat.messages || []), message],
                        updatedAt: message.createdAt,
                        participants: (chat.participants || []).filter(
                          p => !removedCodes.includes(p.user_id)
                        ),
                        lastDecryptedMessage: message,
                      }
                ),
            
                chat:
                  activeChatIdRef.current == chatId
                    ? {
                        ...state.chat,
                        messages: [...(state.chat.messages || []), message],
                        participants: state.chat.participants.filter(
                          p => !removedCodes.includes(p.user_code)
                        ),
                      }
                    : state.chat,
            
                messages:
                  chatId == activeChatIdRef.current
                    ? [...state.messages, message]
                    : state.messages,
              };
            }
            

            case "LEFT_CHAT": {
              const { chatId, user, message } = action.payload;
            
              return {
                ...state,
            
                chats: state.chats.map(chat =>
                  chat.id != message.chat_id
                    ? chat
                    : {
                        ...chat,
                        messages: [...(chat.messages || []), message],
                        updatedAt: message.createdAt,
                        participants: (chat.participants || []).filter(
                          p => p.user_code !== user.user_code
                        ),
                        lastDecryptedMessage: message,
                      }
                ),
            
                chat:
                  state.chat?.id === chatId
                    ? {
                        ...state.chat,
                        messages: [...(state.chat.messages || []), message],
                        participants: state.chat.participants.filter(
                          p => p.user_code !== user.user_code
                        ),
                      }
                    : state.chat,
            
                messages:
                  chatId == activeChatIdRef.current
                    ? [...state.messages, message]
                    : state.messages,
              };
            }

            case "ADD_PARTICIPANTS": {
              const { chatId, participants, message } = action.payload;
            
              const mergeParticipants = (existing = []) => {
                const existingCodes = new Set(existing.map(p => p.user_code));
                const incoming = participants.filter(p => !existingCodes.has(p.user_code));
                return incoming.length ? [...existing, ...incoming] : existing;
              };
            
              return {
                ...state,
            
                chats: state.chats.map(chat =>
                  chat.id != message.chat_id
                    ? chat
                    : {
                        ...chat,
                        messages: [...(chat.messages || []), message],
                        updatedAt: message.createdAt,
                        participants: mergeParticipants(chat.participants),
                        lastDecryptedMessage: message,
                      }
                ),
            
                chat:
                  state.chat?.id === chatId
                    ? {
                        ...state.chat,
                        messages: [...(state.chat.messages || []), message],
                        participants: mergeParticipants(state.chat.participants),
                      }
                    : state.chat,
            
                messages:
                  chatId == activeChatIdRef.current
                    ? [...state.messages, message]
                    : state.messages,
              };
            }

            case "ADD_PARTICIPANT_TO_GROUP": {
              const { chatIds, user, message } = action.payload;
            
              const addUserIfMissing = (participants = []) =>
                participants.some(p => p.user_code === user.user_code)
                  ? participants
                  : [...participants, user];
            
              const isActiveChat = chatIds.includes(activeChatIdRef.current);
            
              return {
                ...state,
            
                chats: state.chats.map(chat =>
                  chatIds.includes(Number(chat.id))
                    ? {
                        ...chat,
                        messages: [...(chat.messages || []), message],
                        updatedAt: message.createdAt,
                        participants: addUserIfMissing(chat.participants),
                        lastDecryptedMessage: message,
                      }
                    : chat
                ),
            
                chat:
                  state.chat && chatIds.includes(Number(state.chat.id))
                    ? {
                        ...state.chat,
                        messages: [...(state.chat.messages || []), message],
                        participants: addUserIfMissing(state.chat.participants),
                      }
                    : state.chat,
            
                messages:
                  isActiveChat
                    ? [...state.messages, message]
                    : state.messages,
              };
            }

            case "MESSAGE_EDITED": {
              const { message } = action.payload;
              const messageId = message.id;
              const chatId = message.chat_id;
            
              const updateEdited = m =>
                m.id == messageId ? { ...m, ...message, edited: true } : m;
            
              let affectedChatId = null;
            
              const chats = state.chats.map(chat => {
                const hasMessage = (chat.messages || []).some(m => m.id == messageId);
                if (!hasMessage) return chat;
            
                affectedChatId = chat.id;
            
                return {
                  ...chat,
                  messages: (chat.messages || []).map(updateEdited),
                  lastDecryptedMessage:
                    chat.lastDecryptedMessage?.id == messageId
                      ? { ...chat.lastDecryptedMessage, ...message, edited: true }
                      : chat.lastDecryptedMessage,
                };
              });
            
              return {
                ...state,
                chats,
            
                // 🔹 update current opened chat object
                chat:
                  state.chat?.id == affectedChatId
                    ? {
                        ...state.chat,
                        messages: (state.chat.messages || []).map(updateEdited),
                      }
                    : state.chat,
            
                // 🔹 update standalone messages (active chat only)
                messages:
                  affectedChatId == activeChatIdRef.current
                    ? state.messages.map(updateEdited)
                    : state.messages,
              };
            }

            case "GROUP_PHOTO_UPDATED": {
              const { chatId, photo } = action.payload;
            
              return {
                ...state,
            
                chats: state.chats.map(chat =>
                  chat.id === chatId
                    ? { ...chat, photo }
                    : chat
                ),
            
                chat:
                  state.chat?.id === chatId
                    ? { ...state.chat, photo }
                    : state.chat,
              };
            }
            

            case "POLL_VOTE_UPDATED": {
              const {
                chat_id,
                poll_id,
                option_id,
                user_id,
                action: voteAction,
              } = action.payload;
            
              const updatePollMessage = msg => {
                if (msg.Poll?.id !== poll_id) return msg;
              
                return {
                  ...msg,
                  Poll: {
                    ...msg.Poll,
                    PollOptions: msg.Poll.PollOptions.map(opt => {
                      const hasVoted = opt.votes?.some(v => v.user_id === user_id);
              
                      // 🔻 remove vote
                      if (
                        hasVoted &&
                        (voteAction === "changed" || voteAction === "unvoted")
                      ) {
                        const votes = opt.votes.filter(v => v.user_id !== user_id);
                        return { ...opt, votes, votes_count: votes.length };
                      }
              
                      // 🔺 add vote
                      if (
                        opt.id === option_id &&
                        (voteAction === "voted" || voteAction === "changed")
                      ) {
                        const votes = [...(opt.votes || []), { user_id }];
                        return { ...opt, votes, votes_count: votes.length };
                      }
              
                      return opt;
                    }),
                  },
                };
              };
              
            
              return {
                ...state,
            
                chats: state.chats.map(chat =>
                  chat.id != chat_id
                    ? chat
                    : {
                        ...chat,
                        messages: (chat.messages || []).map(updatePollMessage),
                      }
                ),
            
                // chat:
                // activeChatIdRef.current == chat_id
                //     ? {
                //         ...state.chat,
                //         messages: (state.chat.messages || []).map(updatePollMessage),
                //       }
                //     : state.chat,
            
                messages:
                  activeChatIdRef.current == chat_id
                    ? state.messages.map(updatePollMessage)
                    : state.messages,
              };
            }


            case "USER_PHOTO_UPDATED": {
              const updatedUser = action.payload;
            
              const updateParticipants = (participants = []) =>
                participants.map((p) =>
                  p.user_code === updatedUser.user_code
                    ? { ...p, user_photo: updatedUser.user_photo }
                    : p
                );
            
              return {
                ...state,
                chats: state.chats.map((chat) => ({
                  ...chat,
                  participants: updateParticipants(chat.participants),
                })),
                chat: state.chat
                  ? {
                      ...state.chat,
                      participants: updateParticipants(state.chat.participants),
                    }
                  : state.chat,
              };
            }

            case "SELF_DELETE_CHAT": {
              const chatId = action.payload;
            
              return {
                ...state,
                chats: state.chats.filter(chat => chat.id !== chatId),
            
                // if the deleted chat is currently open, reset it
                chat: state.chat?.id === chatId ? null : state.chat,
                messages: state.chat?.id === chatId ? [] : state.messages,
              };
            }

            case "POLL_CLOSED": {
              const { chat_id, poll_id } = action.payload;
            
              const updatePollClosed = msg => {
                if (msg.Poll?.id !== poll_id) return msg;
            
                return {
                  ...msg,
                  Poll: {
                    ...msg.Poll,
                    is_closed: true,
                  },
                };
              };
            
              return {
                ...state,
            
                // 🔹 update chats list
                chats: state.chats.map(chat =>
                  chat.id != chat_id
                    ? chat
                    : {
                        ...chat,
                        messages: (chat.messages || []).map(updatePollClosed),
                      }
                ),
            
                // 🔹 update active messages
                messages:
                  activeChatIdRef.current == chat_id
                    ? state.messages.map(updatePollClosed)
                    : state.messages,
              };
            }

            case "PRE_MESSAGE": {
              const optimisticMessage = action.payload;
              if(optimisticMessage.chat_id != activeChatIdRef.current) return state;
              return {
                ...state,
                messages: [...state.messages, optimisticMessage],
              };
            }

            case "DELETE_MESSAGE_FOR_SELF": {
              const { chatId, messageId } = action.payload;
              
              if(activeChatIdRef.current != chatId) return;

              return {
                ...state,
                messages: state.messages.filter(msg => msg.id !== messageId),
              };
            }

            case "REPLACE_OPTIMISTIC_MESSAGE": {
              const realMessage = action.payload;
            
              const existingIndex = state.messages.findIndex(
                msg =>
                  msg.client_temp_id &&
                  msg.client_temp_id === realMessage.client_temp_id
              );
            
              if (existingIndex !== -1) {
                // Replace optimistic message
                const updatedMessages = [...state.messages];
                updatedMessages[existingIndex] = {
                  ...realMessage,
                  isOptimistic: false,
                };
            
                return {
                  ...state,
                  messages: updatedMessages,
                };
              }
            
              // If no optimistic message found (other device case)
              return {
                ...state,
                messages: [...state.messages, realMessage],
              };
            }

            


case "MARK_OPTIMISTIC_FAILED": {
  const { tempId } = action.payload;

  const markFailed = msg =>
    msg.id === tempId ? { ...msg, failed: true } : msg;

  return {
    ...state,
    messages: state.messages.map(markFailed),
  };
}


        // Add this case to your chatsReducer function:

case "PREPEND_MESSAGES": {
  const messages = [...action.payload, ...state.messages];
  const medias = messages.filter(m => ["image", "gif", "sticker"].includes(m?.media_type));
  const files = messages.filter(m => m?.media_type === "file");
  return {
    ...state,
    messages,
    sharedMedias: medias.slice(-3),
    medias,
    sharedFiles: files.slice(-5),
    files,
  };
}

            
            
      
            
            
      default:
        return state;
    }
  }


  const [state, dispatch] = useReducer(chatsReducer, initialState);

  const [chatError, setChatError] = useState(false);

  const [ messagees, setMessages] = useState();


  
  
  

   const { authUser, setAuthUser, isAuthReady ,loading: isFetchLoading,updateAuthenticatedUser } = useAuth();
const hasRunRef = useRef(false);
    const queryClient = useQueryClient();

    const [mutedChat, setMutedChat] = useState(false);
    const [chats, setChats] = useState([]);
    const [ chat, setChat ] = useState(null);
   
    const [ recipient, setRecipient ] = useState(null);
    
    const [ loading, setLoading ] = useState(true);
    const api = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');
    const [typingUsers, setTypingUsers] = useState(new Map());
    const [ onlineUsers, setOnlineUsers ] = useState([]);
    const [ activeUsers, setActiveUsers ] = useState([]);
    const prevChatIdRef = useRef();
    const prevChatIdsRef = useRef([]);
    const isFromCacheRef = useRef(false);
    const [hideActiveStatus, setHideActiveStatus] = useState(false);
    const [isAuthActive, setIsAuthActive] = useState(authUser?.hide_active_status ? false : true);
    // const [ shouldScrollToBottom, setShouldScrollToBottom ] = useState(false);


    // const [ users, setUsers ] = useState([]);
    const [ photos, setPhotos ] = useState([]); 
    const containerBoxRef = useRef();

    async function logAllSessions() {
        const db = await getDB(); // from your idbStore.js
        const tx = db.transaction("keyvaluepairs", "readonly");
        const store = tx.objectStore("keyvaluepairs");
        const allKeys = await store.getAllKeys();
        const sessions = allKeys.filter(k => k.startsWith("session:"));
        console.log("🧩 Existing sessions:", sessions);
    }

useEffect(() => {
    logAllSessions();
},[])


const decryptChatKey = async (chatKeyRecord, chatId) => {
  await sodium.ready;

  console.log("chatKeyRecord24", chatId);
  const { encrypted_chat_key,version  } = chatKeyRecord;
  const latestVersion = chatKeyRecord.version;
  console.log("chatKeyRecordVersion",latestVersion);
  const storedKeys = JSON.parse(localStorage.getItem("e2ee_keypair"));
  console.log("storedKeys", storedKeys);
  const myPrivateKey = sodium.from_base64(storedKeys.secretKeyBase64);
  const myPublicKey = sodium.from_base64(storedKeys.publicKeyBase64);

  const ciphertext = sodium.from_base64(encrypted_chat_key);

  console.log("ciphertext245", myPublicKey);
  console.log("chatKeyBase6424", version);
  const chatKeyUint8 = sodium.crypto_box_seal_open(ciphertext, myPublicKey, myPrivateKey);
  const chatKeyBase64 = sodium.to_base64(chatKeyUint8);




  sessionStorage.setItem(`chatkey_${chatId}_v${version}`, chatKeyBase64);
  sessionStorage.setItem(`chatkey_${chatId}_latestVersion`, version);

  console.log(`✅ Stored chat key v${version} for chat ${chatId}`);
};

const decryptMedia = async (item, chatId) => {
  const mediaId = item.id || item.media_url;

  console.log("media", mediaId);
  console.log("mediaChat", item, "chat", chatId);

  // Cache hit
  // if (decryptedMediaCache.has(mediaId)) {
  //   return decryptedMediaCache.get(mediaId);
  // }

  await sodium.ready;

  const keyBase64 = sessionStorage.getItem(
    `chatkey_${chatId}_v${item.key_version}`
  );
  if (!keyBase64) throw new Error("Missing media key");

  const key = sodium.from_base64(keyBase64);
  console.log("keykey",key, item.id);
  const nonce = sodium.from_base64(item.nonce);

  console.log("none", nonce, item.id);

  const api = import.meta.env.VITE_API_URL;
  const res = await fetch(`${api}/${item.media_url}`);
  const encryptedBase64 = await res.text();

  console.log("encryptedBase64", encryptedBase64, item.id);

  const ciphertext = sodium.from_base64(encryptedBase64.trim());
  console.log("ciphertext", ciphertext, item.id);
  const decryptedBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  console.log("decryptedBytes", decryptedBytes, item.id);

  // MIME type
  let mime = "application/octet-stream";
  switch (item.media_type) {
    case "image": mime = "image/jpeg"; break;
    case "video": mime = "video/mp4"; break;
    case "audio": mime = "audio/mpeg"; break;
    case "file":  mime = "application/octet-stream"; break;
  }

  const blob = new Blob([decryptedBytes], { type: mime });
  const url = URL.createObjectURL(blob);

  decryptedMediaCache.set(mediaId, url);
  return url;
};

useEffect(() => {
  if (!chatId) {
    console.log("No chatId provided, resetting chat state.");
    dispatch({ type: "RESET_CHAT" });
    setRecipient(null);
    setLoading(false);
  }
}, [chatId, dispatch]);

const {
  data: chatData,
  isLoading,
  isError,
  error,
} = useQuery({
  queryKey: ["chat", chatId],
  enabled: !!chatId && !!authUser,
  queryFn: async () => {
    console.log('🔍 Loading chat...');
    try {
      console.log('🌐 Attempting to fetch from API...');
      
      const res = await fetchWithAuth(`${api}/api/chatsOne/${chatId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status !== 200) {
        throw new Error(`API returned status ${res.status}`);
      }

      const info = await res.json();
      const apiChat = info.chatDetail;

      console.log('✅ Successfully fetched from API');

      if (apiChat.chatKey) {
        try {
          await decryptChatKey(apiChat.chatKey, chatId);
        } catch (err) {
          console.error('Failed to decrypt API chat key:', err);
        }
      }

      

      return apiChat;
      
    } catch (apiError) {
      console.error('❌ API fetch failed:', apiError);
      console.log('⚠️ Attempting to load from cache...');
      
      if (window.messageDb) {
        try {
          const cachedChat = await window.messageDb.getChat(chatId);
          
          if (cachedChat) {
            console.log('📦 Loaded chat from cache (offline mode)');
            
            if (cachedChat.chatKey) {
              try {
                await decryptChatKey(cachedChat.chatKey, cachedChat.id);
              } catch (err) {
                console.error('Failed to decrypt cached chat key:', err);
              }
            }
            
            return cachedChat;
          }
        } catch (cacheError) {
          console.error('Failed to load from cache:', cacheError);
        }
      }
      
      throw new Error('Failed to load chat: API request failed and no cached data available');
    }
  },
  staleTime: 30000,
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
});

useEffect(() => {
  setLoading(isLoading);
  if (isError) {
    setChatError(error);
  }
}, [isLoading, isError, error]);

// ============================================================================
// ✅ HANDLE CHAT DATA UPDATES
// ============================================================================
useEffect(() => {
  if (!chatData) return;
  if(!authUser) return;

  console.log('🔄 Updating chat state with:', chatData);
  
  // Update chat state
  dispatch({ type: "SET_CHAT", payload: chatData });

  // Set recipient for DMs
  if (chatData.participants) {
    const recipient = chatData.participants.find(
      (p) => p.user_code !== authUser.user_code
    );
    setRecipient(recipient);
  }

  setLoading(false);
}, [chatData, authUser, dispatch]);


// 4️⃣ Determine loading state
// const isLoading = !cachedChat && !chatFetchData && (isLoadingCache || isChatLoading);
// const isFromCache = !!cachedChat && !chatFetchData;






       

    const fetchUsers = useCallback(async () => {
        try {
          const token = localStorage.getItem('token');
          const api = import.meta.env.VITE_API_URL;

          const response = await fetchWithAuth(`${api}/api/users`, {
            method: 'GET',
            headers: {
            
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch users');
          }
          const data = await response.json();
          console.log("Fetched users:", data);
          return data || [];
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      }, []);

  
    


  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: !!authUser && !isFetchLoading,
    staleTime: 1000 * 60 * 5,
  });

  //        const uploadBackupBlob = async (blob, user) => {
  //   const form = new FormData();
  //   form.append("file", blob);
  //   form.append("userId", user.user_code);

  //   await fetch(`${api}/api/backup`, {
  //     method: "POST", 
  //     body: form,
  //   });
  // };
      
            //  useEffect(() => {
            //         if (!users || users.length === 0) return;
                  
            //         // Prevent double-run (React StrictMode safe)
            //         if (hasRunRef.current) return;
            //         hasRunRef.current = true;
                  
            //         const run = async () => {
            //           await sodium.ready;
                  
            //           for (const user of users) {
            //             try {
            //               console.log(`Generating keypair for ${user.email}...`);
                  
            //               const kp = sodium.crypto_box_keypair();
            //               const keyPair = {
            //                 publicKeyBase64: sodium.to_base64(kp.publicKey),
            //                 secretKeyBase64: sodium.to_base64(kp.privateKey),
            //               };
                  
            //               // Register public key
            //               await fetch(`${api}/api/keys/register`, {
            //                 method: "POST",
            //                 headers: { "Content-Type": "application/json" },
            //                 body: JSON.stringify({
            //                   publicKeyBase64: keyPair.publicKeyBase64,
            //                   userId: user.user_code,
            //                 }),
            //               });
                  
            //               // Backup using user's email
            //               const backupBlob = await createKeyBackupFile(
            //                 keyPair,
            //                 user.email
            //               );
            //               await uploadBackupBlob(backupBlob,user);
                  
            //               console.log(`Backup created for ${user.email}`);
            //             } catch (err) {
            //               console.error(`Key generation failed for ${user.email}`, err);
            //             }
            //           }
            //         };
                  
            //         run();
            //       }, [users]);

// ==================== UPDATED CHAT FETCHING LOGIC ====================
// Replace lines 1488-1662 in ChatsProvider.jsx

function ChatSync() {
    const token = localStorage.getItem("token");
    const api = import.meta.env.VITE_API_URL;
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const cancelledRef = useRef(false);

    const fetchFromApi = useCallback(async () => {
      const response = await fetchWithAuth(`${api}/api/chats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch chats");

      const resData = await response.json();
      const chats = resData.processedChats || [];

      const decryptedChats = [];
      for (const originalChat of chats) {
        try {
          const chat = { ...originalChat };
          if (chat.chatKey) {
            try {
              await decryptChatKey(chat.chatKey, chat.id);
            } catch (err) {
              console.warn("❌ Skip chat (key decrypt failed)", chat.id);
              continue;
            }
          }
          const lastMessage = chat.messages?.length > 0 ? chat.messages[chat.messages.length - 1] : null;
          console.log("lastMessage245", lastMessage);
          if (lastMessage) {
            const decryptedLast = { ...lastMessage };
            if (decryptedLast.ciphertext && decryptedLast.nonce) {
              try {
                decryptedLast.text_content = await decryptInWorker({
                  chatId: chat.id,
                  ciphertext: decryptedLast.ciphertext,
                  nonce: decryptedLast.nonce,
                  version: decryptedLast.key_version,
                });
              } catch {
                console.warn("⚠️ Skip bad last message text", decryptedLast.id);
              }
            }
            if (decryptedLast.media_type) {
              try {
                decryptedLast.decryptedUrl =
                  (decryptedLast.media_type === "gif" || decryptedLast.media_type === "sticker" || !decryptedLast.nonce)
                    ? decryptedLast.media_url
                    : await decryptMedia(decryptedLast, chat.id);
              } catch {
                console.warn("⚠️ Skip bad last media", decryptedLast.id);
              }
            }
            chat.lastDecryptedMessage = decryptedLast;
          }
          decryptedChats.push(chat);
        } catch (err) {
          console.warn("❌ Skip broken chat", originalChat.id, err);
        }
      }

      if (window.messageDb && decryptedChats.length > 0) {
        try {
          const chatsToStore = decryptedChats.map(chat => {
            const lastMsg = chat.lastDecryptedMessage;
            console.log("lastMsg", lastMsg);
            const lastMessageTime = lastMsg?.createdAt ? new Date(lastMsg.createdAt).getTime() : chat.updatedAt ? new Date(chat.updatedAt).getTime() : Date.now();
            return {
              id: chat.id, name: chat.name || null, is_group_chat: chat.is_group_chat || false,
              description: chat.description || null, photo: chat.photo || null, mute_chat: chat.mute_chat || false,
              muted_by: chat.muted_by || [], last_message_time: lastMessageTime, unread_count: chat.unreadCount || 0,
              created_at: chat.createdAt ? new Date(chat.createdAt).getTime() : Date.now(),
              updated_at: chat.updatedAt ? new Date(chat.updatedAt).getTime() : Date.now(),
              participants: chat.participants, lastDecryptedMessage: lastMsg, chatKey: chat.chatKey,
            };
          });
          await window.messageDb.insertChats(chatsToStore);
          console.log('✅ Cached', chatsToStore.length, 'chats to SQLite');
        } catch (err) {
          console.error('Failed to cache chats:', err);
        }
      }
      return decryptedChats;
    }, [token, api]);

    const fetchChatsFn = useCallback(async () => {
      if (!authUser) return;
    
      let cachedChats = null;
    
      // 1️⃣ Try reading cache first (for instant UI)
      if (window.messageDb) {
        try {
          cachedChats = await window.messageDb.getChats(100, 0);
          if (cachedChats?.length > 0) {
            console.log("🗄 Showing cached chats immediately");
            isFromCacheRef.current = true;
            setData(cachedChats);
          }
        } catch (e) {
          console.warn("Cache read failed:", e);
        }
      }
    
      // 2️⃣ Always fetch API in background
      try {
        console.log("🌐 Fetching fresh chats from API...");
        const apiResult = await fetchFromApi();
    
        if (!cancelledRef.current && apiResult) {
          console.log("✅ API returned fresh chats, updating UI");
          isFromCacheRef.current = false;
          setData(apiResult);
          setError(null);
        }
    
        return apiResult;
      } catch (apiError) {
        console.warn("❌ API failed");
    
        // If we already showed cache, keep it and don't throw
        if (cachedChats?.length > 0) {
          console.log("⚠️ Keeping cached data since API failed");
          return cachedChats;
        }
    
        // No cache + API failed = real error
        throw apiError;
      }
    }, [authUser, fetchFromApi]);

    useEffect(() => {
      if (!authUser) return;

      let cancelled = false;
      setIsLoading(true);
      setError(null);

      fetchChatsFn()
        .then((result) => {
          if (!cancelled && result) {
            setData(result);
            setError(null);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err);
            setData(null);
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });

      return () => {
        cancelled = true;
        cancelledRef.current = true;
      };
    }, [authUser, fetchChatsFn]);

    useEffect(() => {
      cancelledRef.current = false;
      return () => { cancelledRef.current = true; };
    }, [authUser]);

    const refetch = useCallback(async () => {
      if (!authUser) return;
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchChatsFn();
        if (result) setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }, [authUser, fetchChatsFn]);

    return {
      data,
      isLoading,
      error,
      refetch,
      isFromCache: isFromCacheRef.current,
      isOffline: !!error && !data,
    };
  }

  // ==================== Use ChatSync ====================
  
  const { 
    data: chatsData, 
    isLoading: isChatsFetchLoading, 
    error: chatsError,
    refetch: fetchChats,
    isFromCache 
  } = ChatSync();

  // ==================== Update Reducer When Data Changes ====================
  
  const lastDispatchedChatsRef = useRef(null);

  useEffect(() => {
    if (!chatsData || chatsData.length === 0) return;

    // Only dispatch if chat IDs actually changed
    const newIds = chatsData.map(c => c.id).sort().join(',');
    
    if (lastDispatchedChatsRef.current !== newIds) {
      lastDispatchedChatsRef.current = newIds;
      console.log('📝 Dispatching chats to reducer:', chatsData.length);
      dispatch({ type: "SET_CHATS", payload: chatsData });
    }
  }, [chatsData]);



// ==================== END OF UPDATED LOGIC ====================
    
        // useEffect(() => {
        //     if (data && data.length > 0) {
        //         const processChats = async () => {
        //         for (const chat of data) {
        //             if (chat.chatKey) {
        //             try {
        //                 await decryptChatKey(chat.chatKey);
        //                 console.log("✅ Decrypted chatKey for chat", chat.id);
        //             } catch (err) {
        //                 console.warn("❌ Failed to decrypt chatKey for", chat.id, err);
        //             }
        //             }
        //         }
        //         setChats(data);
        //         };
        //         processChats();
        //     }
        // }, [data]);


         
        const socketRef = useRef(
  io(import.meta.env.VITE_API_URL, {
    withCredentials: true,
    query: {
      user: JSON.stringify({ staff_code: authUser?.user_code }),
    },
    autoConnect: false, 
  })
        );

  const socket = socketRef.current;

  


  useEffect(() => {
      if (!isAuthReady && !authUser?.user_code) return;
    // const socket = socketRef.current;

  socket.connect();

  console.log("Socket connecting 24:", socket);


    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('getOnlineUsers');
    });

    // socket.on('onlineUsersList', (users) => {
    //   const filtered = users.filter(u => u.user_code !== authUser.user_code);
    //   setOnlineUsers(filtered);
    // });

    socket.on('onlineUsersList', (users) => {
        console.log("OnlineUsersList", users)
        const filtered = users
            .filter(u => u.user_code !== authUser.user_code)
            .filter(u => !u.hide_active_status); 
        setOnlineUsers(filtered);
    });



    socket.on('userConnected', (user) => {
        if (
            user.user_code !== authUser.user_code &&
            !user.hide_active_status
        ) {
            setOnlineUsers(prev => prev.some(u => u.user_code === user.user_code) ? prev : [...prev, user]);
        }
    });

    socket.on('userDisconnected', ({ employeeId }) => {
      console.log('User disconnected:', employeeId);
     setOnlineUsers(prev =>
  prev?.filter(u => u.user_code !== employeeId) || []
);

       setRecipient(prevRecipient => {
  if (!prevRecipient) return prevRecipient;   

  if (prevRecipient.user_code === employeeId) {
    return {
      ...prevRecipient,
      logoutTime: new Date().toISOString()
    };
  }

  return prevRecipient;
});

    
    });



socket.on("userBecameInvisible", ({ employeeId }) => {
    console.log("User Became Invisible:", employeeId);
    if (employeeId === authUser.user_code) {
      setHideActiveStatus(true); 
      setIsAuthActive(false);
           updateAuthenticatedUser({ hide_active_status: true});

      
    }
    setOnlineUsers(prev => prev.filter(u => u.user_code !== employeeId));
    setActiveUsers(prev => prev.filter(u => u.user_code !== employeeId));
  });

  socket.on("userBecameVisible", (user) => {
    console.log("User Became Visible:", user);
    if (user.user_code === authUser.user_code) {
        console.log("It's the authenticated user becoming visible");
      setHideActiveStatus(false);
      updateAuthenticatedUser({ hide_active_status: false });
      setIsAuthActive(true);
    
    }
    setActiveUsers(prev =>
      prev.some(u => u.user_code === user.user_code) ? prev : [...prev, user]
    );
    if (user.user_code !== authUser.user_code && !user.hide_active_status) {
      setOnlineUsers(prev =>
        prev.some(u => u.user_code === user.user_code) ? prev : [...prev, user]
      );
    }
  });

   
     socket.on("newMessage", async (incoming) => {
  const isNewChat = incoming.chat && incoming.message;
  const chatData = isNewChat ? incoming.chat : null;
  const message = isNewChat ? incoming.message : incoming;

  console.log("🟢 New message received:", message);


  // 1️⃣ Ensure we have the chat key decrypted and cached
  const chatId = message.chat_id;
  const version = message.key_version;
  const localKey = sessionStorage.getItem(`chatkey_${chatId}_v${version}`);
  console.log("currentChatData", chatId);


  if (!localKey) {
        try {
        const res = await fetchWithAuth(`${api}/api/chats/${chatId}/key`);
        const chatKeyRecord = await res.json();
        console.log("chatKeyRecordinrealtime24", chatKeyRecord);
        await decryptChatKey(chatKeyRecord, chatId);
        } catch (err) {
        console.warn("Failed to fetch key in realtime", err);
        }
    }
  // const storedChatKey = sessionStorage.getItem(`chatkey_${chatId}`);

  // if (!storedChatKey) {
  //   try {
  //     // Try to get the chatKey (depends on how your backend sends it)
  //     let chatKeyRecord = null;

  //     if (chatData?.chatKey) {
  //       chatKeyRecord = chatData.chatKey;
  //     } else {
  //       // If not sent with the message, fetch it manually
  //       const res = await fetchWithAuth(`${api}/api/chats/${chatId}/key`, {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${token}`,
  //         },
  //       });

  //       if (res.ok) {
  //         chatKeyRecord = await res.json();
  //       } else {
  //         console.warn(`⚠️ Chat key not found for chat ${chatId}`);
  //       }
  //     }

  //     if (chatKeyRecord) {
  //       await decryptChatKey(chatKeyRecord);
  //       console.log(`🔓 Chat key decrypted for real-time chat ${chatId}`);
  //     }
  //   } catch (err) {
  //     console.error("❌ Failed to decrypt real-time chat key:", err);
  //   }
  // }

  // 2️⃣ Try to decrypt the incoming message (if ciphertext exists)
  if (message.ciphertext && message.nonce) {
    try {

         message.text_content = await decryptInWorker({
            chatId,
            ciphertext: message.ciphertext,
            nonce: message.nonce,
            version: message.key_version,
          });
     
    //   message.text_content = await decryptInWorker(
    //     chatId,
    //     message.ciphertext,
    //     message.nonce,
    //     message.key_version,
    //   );
    } catch (err) {
      console.warn("⚠️ Failed to decrypt real-time message", message.id, err);
    }
  }

  // Decrypt originalMessage (reply-to) if present and encrypted
  if (message.originalMessage?.ciphertext && message.originalMessage?.nonce) {
    try {
      message.originalMessage.text_content = await decryptInWorker({
        chatId,
        ciphertext: message.originalMessage.ciphertext,
        nonce: message.originalMessage.nonce,
        version: message.originalMessage.key_version,
      });
    } catch (err) {
      console.warn("⚠️ Failed to decrypt real-time originalMessage", message.originalMessage?.id, err);
    }
  }

  if (message.media_type) {
    if (message.media_type === "gif" || message.media_type === "sticker" || !message.nonce) {
      // GIFs are NOT encrypted
      message.decryptedUrl = message.media_url;
    } else if (message.media_type === "poll") {

    } else {
      try {
        if(!message.nonce) {
          message.decryptedUrl = message.media_url;
        } else {
          message.decryptedUrl = await decryptMedia(message, chatId);
        }
      } catch (err) {
        console.warn("⚠️ Skip bad media", message.id);
        return; // do not continue broken media
      }
    }
  }

  // Same media decryption for reply-to (originalMessage)
  const orig = message.originalMessage;
  if (orig?.media_type) {
    if (orig.media_type === "gif" || orig.media_type === "sticker" || !orig.nonce) {
      orig.decryptedUrl = orig.media_url;
    } else if (orig.media_type === "poll") {

    } else {
      try {
        if (!orig.nonce) {
          orig.decryptedUrl = orig.media_url;
        } else {
          orig.decryptedUrl = await decryptMedia(orig, chatId);
        }
      } catch (err) {
        console.warn("⚠️ Skip bad media on originalMessage", orig.id);
      }
    }
  }

   if (window.messageDb) {
    try {

      
      const messageToCache = {
        id: message.id,
        chat_id: chatId,
        sender_id: message.sender_id || message.sender?.user_code,
        recipient_id: message.recipient_id || null,
        text_content: message.text_content || null,
        media_url: message.media_url || null,
        media_type: message.media_type || null,
        pin: message.pin || false,
        viewed_by: message.viewed_by || [],
        read: message.read || false,
        reply_to: message.reply_to || null,
        edited: message.edited || false,
        deleted_by: message.deleted_by || null,
        is_deleted_for_everyone: message.is_deleted_for_everyone || false,
        deleted_by_user_id: message.deleted_by_user_id || null,
        forwarded_from: message.forwarded_from || null,
        mentions: message.mentions || [],
        ciphertext: message.ciphertext || null,
        nonce: message.nonce || null,
            sender_public_key: message.sender_public_key || null,
            key_version: message.key_version || 1,
            created_at: message.createdAt,
            updated_at: message.updatedAt || message.createdAt,
            decryptedUrl: message.decryptedUrl || null,
            sender: message.sender || null,
            originalMessage: message.originalMessage || null,
            reactions: message.reactions || [],
            Poll: message.Poll || null,
      };

      await window.messageDb.insertMessage(messageToCache);

      const timestamp = new Date(message.createdAt).getTime();
      await window.messageDb.updateChatLastMessageTime(
        chatId,
        timestamp,
        null // or increment unread count if the chat is not active
      );

      await window.messageDb.updateChatLastMessage(chatId, message);

      console.log('✅ Received message cached to SQLite');
      fetchChats();
    } catch (cacheError) {
      console.error('Failed to cache received message:', cacheError);
    }
  }

  


  // 3️⃣ Update chats state
  dispatch({
    type: "UPSERT_CHAT_WITH_MESSAGE",
    payload: {
      chatId,
      message,
      chatData,
    },
  });

   const isMine =
    message.sender_id === authUser.user_code &&
    message.client_temp_id;

    console.log("isMine", message);


  if(message.chat_id == activeChatIdRef.current) {
    console.log("activeChatId",activeChatIdRef.current);

 if (isMine) {
      // 🔁 replace optimistic message
      dispatch({
        type: "REPLACE_OPTIMISTIC_MESSAGE",
        payload: message,
      });
    } else {
      // ➕ normal incoming message
      dispatch({
        type: "APPEND_ACTIVE_MESSAGE",
        payload: { ...message, isNew: true },
      });
    }

// media derived stays reducer-owned
if (message.media_type) {
  dispatch({
    type: "APPEND_MEDIA",
    payload: message,
  });
}
  }
 


  // optional: media preview updates
  
});



    socket.on("pinMessage", async (data) => {
      const chatId = data.message.chat_id;

      console.log("pinChatId", data);

      // optional: decrypt message if needed
      // await decryptInWorker(...)

      dispatch({
        type: "PIN_MESSAGE",
        payload: {
          chatId,
          message: data.message,
          pinMessageId: data.pinMessageId,
        },
      });
    });

    socket.on("unPinMessage", async (data) => {
      const chatId = data.message.chat_id;

      // optional: decrypt message if needed
      // await decryptInWorker(...)

      dispatch({
        type: "UNPIN_MESSAGE",
        payload: {
          chatId,
          message: data.message,
          pinMessageId: data.pinMessageId,
        },
      });
    });
       
     
    socket.on("deleteMessage", ({ chatId, messageId, lastMessage }) => {
      dispatch({
        type: "MESSAGE_DELETED",
        payload: {
          chatId,
          messageId,
          meta: {
            deletedByUser: lastMessage.deletedByUser,
            deleted_by_user_id: lastMessage.deleted_by_user_id,
          },
        },
      });
    });
    
    // socket.on('deleteMessage', ({chatId, messageId, lastMessage}) => {
    //      console.log("Deleted message:", lastMessage);  
    //             setMessages((prevMessages) => {
    //                     return prevMessages.map((message) => {
    //                         if (message.id === messageId) {
    //                             return {
    //                                 ...message,
    //                                 text_content: null,
    //                                 media_url: null,
    //                                 media_type: null,
    //                                 deletedByUser: lastMessage.deletedByUser,
    //                                 deleted_by_user_id: lastMessage.deleted_by_user_id,
    //                             };
    //                         }
    //                         return message; // Return unchanged messages
    //                     });
    //                 });
    //             setChats((prevChats) =>
    //                 produce(prevChats, (draft) => {
    //                     console.log("draftChats", draft);
    //                     const chat = draft.find((c) => c.id == chatId);
    //                     console.log("HelloUser", chat);
    //                     if (chat) {
    //                         const messageIndex = chat.messages.findIndex((m) => m.id === messageId);
    //                         if (messageIndex !== -1) {
    //                             chat.messages[messageIndex] = {
    //                                 ...chat.messages[messageIndex],
    //                                 text_content: null,
    //                                 media_url: null,
    //                                 media_type: null,
    //                                 deletedByUser: lastMessage.deletedByUser,
    //                                 delete_by_user_id: lastMessage.delete_by_user_id,
    //                             };
    //                         }
    //                         if (chat.lastDecryptedMessage) {
    //                           chat.lastDecryptedMessage = {
    //                             ...chat.lastDecryptedMessage,
    //                             text_content: null,
    //                             media_url: null,
    //                             media_type: null,
    //                             deletedByUser: chat.lastDecryptedMessage.deletedByUser,
    //                             delete_by_user_id: chat.lastDecryptedMessage.delete_by_user_id,
    //                             ciphertext: null,
    //                             nonce: null,
    //                           };
    //                         }

    //                     }
    //                 })
    //             );
    // })


   
    
//     socket.on('lastMessage', (lastMessage) => {
//         console.log("New lastMessage received:", lastMessage);

// setChats((prevChats) =>
//   produce(prevChats, (draft) => {
//     const chatIndex = draft.findIndex((c) => c.id === lastMessage.chat_id);
//     if (chatIndex !== -1) {
//       const chat = draft[chatIndex];

//       // Ensure messages array exists
//       (chat.messages ??= []).push(lastMessage);

//       // Move updated chat to top
//       draft.splice(chatIndex, 1);
//       draft.unshift(chat);
//     }
//   })
// );
//     })
    
    // socket.on('userPhoto', (updatedUser) => {
    //          console.log("Hello UsersPhoto", updatedUser);
    //         setChats((prevChats) =>
    //             produce(prevChats, (draft) => {
    //                 draft.forEach((chat) => {
    //                     chat.participants.forEach((participant) => {
    //                         if (participant.user_code === updatedUser.user_code) {
    //                             participant.user_photo = updatedUser.user_photo;
    //                         }
    //                     });
    //                 });
    //             })
    //         );

    //         setChat((prevChat) => {
    //             if (!prevChat) return prevChat;
    //             return {
    //                 ...prevChat,
    //                 participants: prevChat.participants.map((participant) =>
    //                     participant.user_code === updatedUser.user_code
    //                         ? { ...participant, user_photo: updatedUser.user_photo }
    //                         : participant
    //                 ),
    //             };
    //         });

    //         setOnlineUsers((prevOnlineUsers) => {
    //             return prevOnlineUsers.map((user) =>
    //                 user.user_code === updatedUser.user_code
    //                     ? { ...user, user_photo: updatedUser.user_photo }
    //                     : user
    //             );
    //         })

    //         queryClient.setQueryData(['users'], (oldUsers) => {
    //             if (!oldUsers) return oldUsers;

    //             return oldUsers.map((user) =>
    //                 user.user_code === updatedUser.user_code
    //                     ? { ...user, user_photo: updatedUser.user_photo }
    //                     : user
    //             );
    //         });
    // })


    socket.on('userPhoto', (updatedUser) => {
      console.log("📸 User photo updated:", updatedUser);
    
      // 🔹 Update chats and active chat via reducer
      dispatch({
        type: 'USER_PHOTO_UPDATED',
        payload: updatedUser,
      });
    
      // 🔹 Update online users directly via state
      setOnlineUsers((prevOnlineUsers) =>
        prevOnlineUsers.map((user) =>
          user.user_code === updatedUser.user_code
            ? { ...user, user_photo: updatedUser.user_photo }
            : user
        )
      );
    
      // 🔹 Update query cache for users
      queryClient.setQueryData(['users'], (oldUsers) =>
        oldUsers?.map((user) =>
          user.user_code === updatedUser.user_code
            ? { ...user, user_photo: updatedUser.user_photo }
            : user
        )
      );
    });
    
    
    socket.on("readMessage", data => {
      console.log("Mark Read", data);
    
      dispatch({
        type: "MESSAGE_READ",
        payload: {
          chatId: Number(data.chatId),
          messageId: data.messageId,
          userId: data.userId,
        },
      });
    });
    

    socket.on('unReadMessage', (data) => {
        dispatch({
          type: "MESSAGE_UNREAD",
          payload: {
            chatId: data.chatId,
            messageId: data.messageId,
            userId: data.userId,
          },
        });
    })

    // socket.on('unReadMessage', (data) => {
    //     console.log("Mark UnRead Latest Message", data);
    //     setChats((prevChats) =>
    //         produce(prevChats, (draft) => {
    //             const chat = draft.find((c) => c.id === Number(data.chatId));
    //             if (chat) {
    //                 const message = chat.messages.find((m) => m.id === data.messageId);
    //                 if (message) {
    //                     const viewedByArray = Array.isArray(message.viewed_by)
    //                         ? message.viewed_by
    //                         : typeof message.viewed_by === "string"
    //                         ? (() => {
    //                             try {
    //                                 return JSON.parse(message.viewed_by);
    //                             } catch {
    //                                 return [];
    //                             }
    //                         })()
    //                         : [];

    //                     const viewedBySet = new Set(viewedByArray);
    //                     viewedBySet.delete(data.userId);

    //                     message.viewed_by = Array.from(viewedBySet);
    //                     if (chat.lastDecryptedMessage) {
    //                         chat.lastDecryptedMessage.viewed_by = Array.from(viewedBySet);
    //                     }
                        
    //                 }
    //             }
    //         })
    //     );

   

    //     setMessages((prevMessages) => {
    //         return prevMessages.map((message) => {
    //             if (message.id === data.messageId) {
    //                 const viewedByArray = Array.isArray(message.viewed_by)
    //                     ? message.viewed_by
    //                     : typeof message.viewed_by === "string"
    //                     ? (() => {
    //                         try {
    //                             return JSON.parse(message.viewed_by);
    //                         } catch {
    //                             return [];
    //                         }
    //                     })()
    //                     : [];

    //                 const viewedBySet = new Set(viewedByArray);
    //                 viewedBySet.delete(data.userId);

    //                 return {
    //                     ...message,
    //                     viewed_by: Array.from(viewedBySet),
    //                 };
    //             }
    //             return message;
    //         });
    //     });
    // })
    
    socket.on('newReaction', (reaction) => {
      console.log("New reaction received:", reaction);
      dispatch({
        type: "REACTION_ADDED",
        payload: {
          reaction: reaction,
        },
      });
    })

    // socket.on('newReaction', (reaction) => {
    //          console.log("New reaction received:", reaction);
    //         setChats((prevChats) =>
    //             produce(prevChats, (draft) => {
    //                 const chat = draft.find((c) => c.messages.some(m => m.id === reaction.message_id));
    //                 if (chat) {
    //                     const message = chat.messages.find(m => m.id === reaction.message_id);
    //                     if (message) {
    //                         message.reactions = [...(message.reactions || []), reaction];
                           
    //                     }
    //                 }
    //             })
    //         );

    //         setMessages((prevMessages) => {
    //             // Map over messages and add the reaction to the correct message
    //             const updatedMessages = prevMessages.map((message) => {
    //                 if (message.id === reaction.message_id) {
    //                     // Ensure reactions exist, and then add the new reaction
    //                     return {
    //                         ...message,
    //                         reactions: [...(message.reactions || []), reaction], // Add reaction to existing or empty array
    //                     };
    //                 }
    //                 return message;
    //             });
    
    //             // Sort the messages by 'createdAt' after adding the reaction
    //             const sortedMessages = [...updatedMessages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    //             return sortedMessages; // Return the sorted and updated message list
    //         });
    // })
     
    socket.on("removeReaction", reaction => {
      dispatch({
        type: "REACTION_REMOVED",
        payload: { reaction },
      });
    });
    

    // socket.on('removeReaction', (reaction) => {
    //      console.log("Updated reaction received:", reaction);
    //         setMessages((prevMessages) => {
                
    //                 const updatedMessages = prevMessages.map((message) => {
    //                     if (message.id == reaction?.messageId) {
    //                         return {
    //                             ...message,
    //                             reactions: (message.reactions || []).filter(
    //                                 (r) => r.user_id !== reaction?.userId
    //                             ), 
    //                         };
    //                     }
    //                     return message;
    //                 });
        
                  
    //                 const sortedMessages = [...updatedMessages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
    //                 return sortedMessages; // Return the sorted and updated message list
    //             });
    // })

    socket.on("updatedReaction", reaction => {
      dispatch({
        type: "REACTION_UPDATED",
        payload: { reaction },
      });
    });
    

    // socket.on('updatedReaction', (reaction) => {
    //      console.log("Updated reaction received:", reaction);
    //         setMessages((prevMessages) => {
    //             // Map over messages and update the reaction in the correct message
    //             const updatedMessages = prevMessages.map((message) => {
    //                 if (message.id === reaction.message_id) {
    //                     // Update the reaction if it exists, or add it if it doesn't
    //                     const updatedReactions = (message.reactions || []).map((r) =>
    //                         r.user_id === reaction.user_id ? { ...r, reaction_type: reaction.reaction_type } : r
    //                     );
    
    //                     // Check if the user hasn't reacted yet (add the new reaction)
    //                     const hasReacted = updatedReactions.some((r) => r.user_id === reaction.user_id);
    //                     if (!hasReacted) {
    //                         updatedReactions.push(reaction);
    //                     }
    
    //                     return {
    //                         ...message,
    //                         reactions: updatedReactions,
    //                     };
    //                 }
    //                 return message;
    //             });
    
    //             // Sort messages by 'createdAt' (if needed)
    //             const sortedMessages = [...updatedMessages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    //             return sortedMessages;
    //         });
    // })

    // socket.on('newAdmin', (data) => {
    //      console.log("New admin data received:", data);
          

    //         if (activeChatIdRef.current == Number(data.chatId)) {
    //             setChat((prevChat) => {
    //             if (!prevChat) return prevChat;

    //             const existingParticipants = prevChat.ownerAdmins || [];

    //             const alreadyExists = existingParticipants.some(
    //                 (admin) => admin.user_code === data.newAdmin.user_code
    //             );

    //             if (alreadyExists) return prevChat;

    //             return {
    //                 ...prevChat,
    //                 ownerAdmins: [...existingParticipants, data.newAdmin],
    //             };
    //             });
    //         }
    // })


    socket.on("newAdmin", data => {
      console.log("New admin data received:", data);
    
      dispatch({
        type: "ADD_CHAT_ADMIN",
        payload: {
          chatId: Number(data.chatId),
          admin: data.newAdmin,
        },
      });
    });
    

    // socket.on('removeParticipant', ({chatId, removeParticipants,message}) => {
       
    //         console.log("New removed data received:", chatId);
    //         console.log("New removed message received:", message);

    //         setChats((prevChats) =>
    //     produce(prevChats, (draft) => {
    //         let chat = draft.find((c) => c.id == message.chat_id);

    //         if (chat) {
    //             chat.messages = chat.messages || [];
    //             chat.messages.push(message);
    //             chat.updatedAt = message.createdAt;

    //             chat.participants = (chat.participants || []).filter(
    //                 (p) =>
    //                     !removeParticipants.some(
    //                         (r) => r.user_code === p.user_code 
    //                     )
    //             );
    //         } 
    //          else {
    //             console.warn("Message received but chat not found and no chatData provided:", message);
    //         }
    //     })
    // );

            
    //     if(activeChatIdRef.current == Number(chatId)) {
    //          setChat((prevChat) => {
    // if (!prevChat || prevChat.id !== Number(chatId)) return prevChat;

    // // Update messages
    // const updatedMessages = [...(prevChat.messages || []), message];

    // console.log("updatedMessages", updatedMessages)

    // // Merge participants (avoid duplicates)
    // const existingParticipants =  prevChat.participants.filter(
    //                     (parti) => parti.user_code !== removeParticipants[0]?. user_id
    //                 )

    // return {
    //     ...prevChat,
    //     messages: updatedMessages,
    //     participants: existingParticipants,
    // };


              
    //         })
    //     }

    //          if (Number(message.chat_id) == activeChatIdRef.current) {
    //     setMessages((prevMessages) => [...prevMessages, message]);
    // }
    // })

    socket.on("removeParticipant", ({ chatId, removeParticipants, message }) => {
      
      dispatch({
        type: "REMOVE_PARTICIPANTS",
        payload: {
          chatId: Number(chatId),
          removed: removeParticipants,
          message,
        },
      });
    });
    

    // socket.on('leftChat', ({chatId, leftParticipant, message}) => {
       
    //         console.log("New removed data received:", chatId);
    //         console.log("New removed message received:", message);

    //         setChats((prevChats) =>
    //     produce(prevChats, (draft) => {
    //         let chat = draft.find((c) => c.id == message.chat_id);

    //         if (chat) {
    //             chat.messages = chat.messages || [];
    //             chat.messages.push(message);
    //             chat.updatedAt = message.createdAt;
    //         } 
    //          else {
    //             console.warn("Message received but chat not found and no chatData provided:", message);
    //         }
    //     })
    // );

            
    //     if(activeChatIdRef.current == Number(chatId)) {
    //          setChat((prevChat) => {
    // if (!prevChat || prevChat.id !== Number(chatId)) return prevChat;

    // // Update messages
    // const updatedMessages = [...(prevChat.messages || []), message];

    // console.log("updatedMessages", updatedMessages)

    // // Merge participants (avoid duplicates)
    // const existingParticipants =  prevChat.participants.filter(
    //                     (parti) => parti.user_code !== leftParticipant.user_code
    //                 )

    // return {
    //     ...prevChat,
    //     messages: updatedMessages,
    //     participants: existingParticipants,
    // };


              
    //         })
    //     }

    //          if (Number(message.chat_id) == activeChatIdRef.current) {
    //     setMessages((prevMessages) => [...prevMessages, message]);
    // }
    // })

    socket.on("leftChat", ({ chatId, leftParticipant, message }) => {
      dispatch({
        type: "LEFT_CHAT",
        payload: {
          chatId: Number(chatId),
          user: leftParticipant,
          message,
        },
      });
    });
    

//     socket.on('newParticipants', ({ chatId, newParticipants, message}) => {
//          console.log("New participants received:", newParticipants);
//     console.log("New message received:", message);

//     // 1. Update chat list with message
//     setChats((prevChats) =>
//         produce(prevChats, (draft) => {
//             let chat = draft.find((c) => c.id == message.chat_id);

//             if (chat) {
//                 chat.messages = chat.messages || [];
//                 chat.messages.push(message);
//                 chat.updatedAt = message.createdAt;

//                   const existingParticipants = chat.participants || [];
//                     const filteredParticipants = newParticipants.filter(
//                         (incoming) =>
//                             !existingParticipants.some(
//                                 (existing) => existing.user_code === incoming.user_code
//                             )
//                     );

//                     if (filteredParticipants.length > 0) {
//                         chat.participants = [...existingParticipants, ...filteredParticipants];
//                     }
//             } 
//              else {
//                 console.warn("Message received but chat not found and no chatData provided:", message);
//             }
//         })
//     );

//     // 2. Update currently selected chat's messages
//    if( activeChatIdRef.current == Number(chatId)) {
//      setChat((prevChat) => {
//     if (!prevChat || prevChat.id !== Number(chatId)) return prevChat;

//     // Update messages
//     const updatedMessages = [...(prevChat.messages || []), message];

//     console.log("updatedMessages", updatedMessages)

//     // Merge participants (avoid duplicates)
//     const existingParticipants = prevChat.participants || [];
//     const filteredParticipants = newParticipants.filter(
//         (incoming) =>
//             !existingParticipants.some(
//                 (existing) => existing.user_code === incoming.user_code
//             )
//     );
//     const updatedParticipants = [
//         ...existingParticipants,
//         ...filteredParticipants,
//     ];

//     return {
//         ...prevChat,
//         messages: updatedMessages,
//         participants: updatedParticipants,
//     };
// });
//    }


//     // 3. Append to standalone messages state
//     if (Number(message.chat_id) == activeChatIdRef.current) {
//         setMessages((prevMessages) => [...prevMessages, message]);
//     }
//     })

socket.on("newParticipants", ({ chatId, newParticipants, message }) => {
  console.log("New participants received:", newParticipants);
  console.log("New message received:", message);

  dispatch({
    type: "ADD_PARTICIPANTS",
    payload: {
      chatId: Number(chatId),
      participants: newParticipants,
      message,
    },
  });
});

socket.on("newParticipantToGroup", ({ chatIds, user, message }) => {
  console.log("New participant to group received:", user);
  console.log("New chatIds to group received:", chatIds);

  dispatch({
    type: "ADD_PARTICIPANT_TO_GROUP",
    payload: {
      chatIds: chatIds.map(Number),
      user,
      message,
    },
  });
});


    // socket.on('newParticipantToGroup', ({ chatIds, user, message }) => {
    //     console.log("New participant to group received:", user);
    //     console.log("New chatIds to group received:", chatIds);
    //     console.log("New message received:", message);

    //     // 1. Update chat list with message for all chatIds
    //     setChats((prevChats) =>
    //         produce(prevChats, (draft) => {
    //             chatIds.forEach((id) => {
    //                 const chat = draft.find((c) => Number(c.id) === Number(id));
    //                 if (chat) {
    //                     chat.messages = chat.messages || [];
    //                     chat.messages.push(message);
    //                     chat.updatedAt = message.createdAt;

    //                     // Merge single user into participants if not already there
    //                     const existingParticipants = chat.participants || [];
    //                     const alreadyExists = existingParticipants.some(
    //                         (existing) => existing.user_code === user.user_code
    //                     );
    //                     if (!alreadyExists) {
    //                         chat.participants = [...existingParticipants, user];
    //                     }
    //                 } else {
    //                     console.warn(`Message received but chat with id ${id} not found:`, message);
    //                 }
    //             });
    //         })
    //     );

    //     // 2. Update current chat if it's in chatIds
    //     if (chatIds.some((id) => Number(id) == activeChatIdRef.current)) {
    //         setChat((prevChat) => {
    //             if (!prevChat || !chatIds.includes(Number(prevChat.id))) return prevChat;

    //             const updatedMessages = [...(prevChat.messages || []), message];
    //             const existingParticipants = prevChat.participants || [];
    //             const alreadyExists = existingParticipants.some(
    //                 (existing) => existing.user_code === user.user_code
    //             );

    //             return {
    //                 ...prevChat,
    //                 messages: updatedMessages,
    //                 participants: alreadyExists
    //                     ? existingParticipants
    //                     : [...existingParticipants, user],
    //             };
    //         });
    //     }

    //     // 3. Append to standalone messages state if current chat matches
    //     if (Number(message.chat_id) == activeChatIdRef.current) {
    //         setMessages((prevMessages) => [...prevMessages, message]);
    //     }
    // });




  socket.on('newGroupChat', () => {
    console.log("New group chat created");
    fetchChats();
  })

  

 

  // socket.on('updateForwardLastMessage', (lastMessage) => {
  //    console.log("New Forward lastMessage received:", lastMessage);
  //   setChats((prevChats) =>
  //       produce(prevChats, (draft) => {
  //           const chatIndex = draft.findIndex((c) => c.id === lastMessage.chat_id
  //           );
  //           if (chatIndex !== -1) {
  //               const chat = draft[chatIndex];
  //               // Ensure messages array exists
  //               (chat.messages ??= []).push(lastMessage);
  //               // Move updated chat to top
  //               draft.splice(chatIndex, 1);
  //               draft.unshift(chat);
  //           }
  //       })
  //   );

  //   if(lastMessage.chat_id == activeChatIdRef.current) {
  //      setMessages((prevMessages) => {
  //           const updatedMessages = [...prevMessages, lastMessage];
  //           // Sort messages by 'createdAt' (if needed)
  //           const sortedMessages = updatedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  //           return sortedMessages; // Return the sorted and updated message list
  //       });
  //   }
  // })

  socket.on("updateForwardLastMessage", lastMessage => {
    console.log("New Forward lastMessage received:", lastMessage);
  
    dispatch({
      type: "FORWARD_LAST_MESSAGE",
      payload: { message: lastMessage },
    });
  });
  

       


    
    socket.on('userTyping', ({ chatId, userId, username }) => {
             if (userId === authUser.user_code) return;

      if (Number(chatId) == activeChatIdRef.current) {
        setTypingUsers(prev => {
            const newMap = new Map(prev);
            const chatUsers = newMap.get(chatId) || new Map();
            chatUsers.set(userId, username);
            newMap.set(chatId, chatUsers);
            return newMap;
        });
      }
    });

    socket.on('userStoppedTyping', ({ chatId, userId }) => {
      if (Number(chatId) == activeChatIdRef.current) {
         setTypingUsers(prev => {
            const newMap = new Map(prev);
            const chatUsers = newMap.get(chatId);
            if (chatUsers) {
            chatUsers.delete(userId);
            if (chatUsers.size === 0) {
                newMap.delete(chatId);
            } else {
                newMap.set(chatId, chatUsers);
            }
            }
            return newMap;
        });
      }
    });

    socket.on("groupPhoto", (updatedGroup) => {
      console.log("Received updated group photo:", updatedGroup);
    
      dispatch({
        type: "GROUP_PHOTO_UPDATED",
        payload: {
          chatId: Number(updatedGroup.id),
          photo: updatedGroup.photo,
        },
      });
    });
    

    // socket.on('groupPhoto', (updatedGroup) => {
    //      console.log("Received updated group photo:", updatedGroup);

    //   queryClient.setQueryData(['chats'], (oldChats) => {
    //       if (!oldChats) return oldChats;

    //       return produce(oldChats, (draft) => {
    //           const chat = draft.find(c => c.id === updatedGroup.id);
    //           if (chat) {
    //               chat.photo = updatedGroup.photo;
    //           }
    //       });
    //   });

    //   if(activeChatIdRef.current == Number(updatedGroup.id)) {
    //     setChat((prevChat) => {
    //         if (!prevChat) return prevChat;
    //         return {
    //             ...prevChat,
    //             photo: updatedGroup.photo,
    //         };
    //     });
    //   }
    

    
    // })


    socket.on("poll_vote_update", (data) => {
      dispatch({
        type: "POLL_VOTE_UPDATED",
        payload: data,
      });
    });
    

  // socket.on("poll_vote_update", (data) => {
  // if (data.chat_id !== Number(chat.id)) return;

  // setMessages((prev) =>
  //   prev.map((msg) => {
  //     if (msg.Poll?.id !== data.poll_id) return msg;

  //     return {
  //       ...msg,
  //       Poll: {
  //         ...msg.Poll,
  //         PollOptions: msg.Poll.PollOptions.map((opt) => {
  //           const hasUserVoted = opt.votes?.some(
  //             (v) => v.user_id === data.user_id
  //           );

  //           // 1️⃣ REMOVE vote from old option (when changed or unvoted)
  //           if (
  //             hasUserVoted &&
  //             (data.action === "changed" || data.action === "unvoted")
  //           ) {
  //             const newVotes = opt.votes.filter(
  //               (v) => v.user_id !== data.user_id
  //             );

  //             return {
  //               ...opt,
  //               votes: newVotes,
  //               votes_count: newVotes.length,
  //             };
  //           }

  //           // 2️⃣ ADD vote to new option
  //           if (
  //             opt.id === data.option_id &&
  //             (data.action === "voted" || data.action === "changed")
  //           ) {
  //             const newVotes = [
  //               ...opt.votes,
  //               { user_id: data.user_id },
  //             ];

  //             return {
  //               ...opt,
  //               votes: newVotes,
  //               votes_count: newVotes.length,
  //             };
  //           }

  //           return opt;
  //         }),
  //       },
  //     };
  //   })
  // );
  // });

socket.on("editedMessage", async (message) => {
  console.log("editedMessage", message);

  const chatId = message.chat_id;
  const version = message.key_version;

  // 🔑 Ensure key exists
  const localKey = sessionStorage.getItem(`chatkey_${chatId}_v${version}`);
  if (!localKey) {
    try {
      const res = await fetchWithAuth(`${api}/api/chats/${chatId}/key`);
      const chatKeyRecord = await res.json();
      await decryptChatKey(chatKeyRecord, chatId);
    } catch (err) {
      console.warn("Failed to fetch key in realtime", err);
    }
  }

  // 🔓 Decrypt text
  if (message.ciphertext && message.nonce) {
    try {
      message.text_content = await decryptInWorker({
        chatId,
        ciphertext: message.ciphertext,
        nonce: message.nonce,
        version: message.key_version,
      });
    } catch (err) {
      console.warn("Failed to decrypt edited message", message.id, err);
    }
  }

  // 🖼 Decrypt media
  if (message.media_type) {
    try {
      if (message.media_type === "gif") {
        message.decryptedUrl = message.media_url;
      } else if (message.media_type !== "poll") {
        message.decryptedUrl = await decryptMedia(message, chatId);
      }
    } catch {
      console.warn("Skip broken media", message.id);
      return;
    }
  }

  // 🚀 Dispatch once
  dispatch({
    type: "MESSAGE_EDITED",
    payload: {
      message: {
        ...message,
        edited: true,
      },
    },
  });
});

socket.on("pollClosed", (payload) => {
  console.log("pollClosed", payload);

  dispatch({
    type: "POLL_CLOSED",
    payload,
  });
});



//  socket.on("editedMessage", async (message) => {
    
//       console.log("editedMessage", message);
      
//       const chatId = message.chat_id;
//       const version = message.key_version;
//       const localKey = sessionStorage.getItem(`chatkey_${chatId}_v${version}`);
    
//       if (!localKey) {
//             try {
//             const res = await fetchWithAuth(`${api}/api/chats/${chatId}/key`);
//             const chatKeyRecord = await res.json();
//             console.log("chatKeyRecordinrealtime24", chatKeyRecord);
//             await decryptChatKey(chatKeyRecord, chatId);
//             } catch (err) {
//             console.warn("Failed to fetch key in realtime", err);
//             }
//         }
      
//       // 2️⃣ Try to decrypt the incoming message (if ciphertext exists)
//       if (message.ciphertext && message.nonce) {
//         try {
    
//              message.text_content = await decryptInWorker({
//                 chatId,
//                 ciphertext: message.ciphertext,
//                 nonce: message.nonce,
//                 version: message.key_version,
//               });
         
//         //   message.text_content = await decryptInWorker(
//         //     chatId,
//         //     message.ciphertext,
//         //     message.nonce,
//         //     message.key_version,
//         //   );
//         } catch (err) {
//           console.warn("⚠️ Failed to decrypt real-time message", message.id, err);
//         }
//       }
    
//       if (message.media_type) {
//         if (message.media_type === "gif") {
//           // GIFs are NOT encrypted
//           message.decryptedUrl = message.media_url;
//         } else if(message.media_type === "poll") {
    
//         } else {
//           try {
//             message.decryptedUrl = await decryptMedia(message, chatId);
//           } catch (err) {
//             console.warn("⚠️ Skip bad media", message.id);
//             return; // do not continue broken media
//           }
//         }
//       }
    
     
//       if(message.chat_id != activeChatIdRef.current) return;
    
     
    
      
//       setMessages((prevMessages) => {
//   console.log("REAL messages:", prevMessages);
//   return prevMessages.map((m) =>
//     m.id === message.id
//       ? { ...m, ...message, edited: true }
//       : m
//   );
// });
    
     
     
//     });
   

    return () => {
        socket.off('newMessage')
        socket.off('pinMessage')
        socket.off('unPinMessage')
        socket.off('deleteMessage')
        socket.off('userPhoto')
        socket.off('readMessage')
        socket.off('unReadMessage')
        socket.off('newMessage')
        socket.off('newReaction')
        socket.off('removeReaction')
        socket.off('updatedReaction')
        socket.off('newAdmin')
        socket.off('removeParticipant')
        socket.off('leftChat')
        socket.off('newParticipants')
        socket.off('newGroupChat')
        socket.off('updateForwardLastMessage')
        socket.off('userTyping')
        socket.off('userStopTyping')
        socket.off('groupPhoto')
        socket.off('newParticipantToGroup')
        socket.off('poll_vote_update')
        socket.off('editedMessage')
      
    };
  }, []);




useEffect(() => {
  if (!activeChatIdRef.current) return;

  if (prevChatIdRef.current && prevChatIdRef.current != activeChatIdRef.current) {
    socket.emit("leaveChat", prevChatIdRef.current);
  }

  socket.emit("joinChat", Number(activeChatIdRef.current));
  prevChatIdRef.current = chat.id;
}, [chat]);

    useEffect(() => {
  if (!socket || !chats.length) return;

  const newChatIds = chats.map(chat => chat.id);
  const prevChatIds = prevChatIdsRef.current;

  // Avoid rejoining if the list didn't change
  const same = prevChatIds.length === newChatIds.length &&
               prevChatIds.every((id, i) => id === newChatIds[i]);

  if (same) return;

  if (prevChatIds.length) {
    console.log("Leaving previous chat rooms:", prevChatIds);
    socket.emit("leaveChatRooms", prevChatIds);
  }

  console.log("Joining chat rooms:", newChatIds);
  socket.emit("joinChatRooms", newChatIds);

  prevChatIdsRef.current = newChatIds;
}, [socket, chats]);

  return (
    <ChatsContext.Provider 
      value={{
        socket,
        chats: state.chats,
        recipient,
        setRecipient,
        typingUsers,
        setTypingUsers,
        onlineUsers,
        activeUsers,
        users,
        chat: state.chat,
        messages: state.messages,
        files: state.files,
        sharedFiles: state.sharedFiles,
        medias: state.medias,
        sharedMedias: state.sharedMedias,
        pinnedMessage: state.pinnedMessage,
        chatId,
        setChatId,
        dispatch,
        fetchChats,
        chatError,
        setChatError,
        mutedChat,
        setMutedChat,
        decryptMedia,
        
      }}
      
    >
      {children}
    </ChatsContext.Provider>
  );
}
