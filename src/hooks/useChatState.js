import { useImmerReducer } from 'use-immer';

const initialState = {
  chats: [],
  chat: null,
  messages: [],
  typingUsers: new Map(),
  pinnedMessage: [],
  onlineUsers: [],
  sharedFiles: [],
  files: [],
  sharedMedias: [],
  medias: [],
  recipient: null,
  loading: true,
  mutedChat: false,
};

function chatReducer(draft, action) {
  switch (action.type) {
    case 'SET_CHATS':
      draft.chats = action.payload;
      break;
    case 'SET_CHAT':
      draft.chat = action.payload;
      break;
    case 'ADD_MESSAGE':
      draft.messages.push(action.payload);
      break;
    case 'SET_MESSAGES':
      draft.messages = action.payload;
      break;
    case 'UPDATE_CHAT_MESSAGES':
      {
        const chat = draft.chats.find(c => c.id === action.payload.chatId);
        if (chat) {
          chat.messages.push(action.payload.message);
        }
      }
      break;
    case 'SET_TYPING_USERS':
      draft.typingUsers = new Map(action.payload);
      break;
    case 'UPDATE_TYPING_USER':
      draft.typingUsers.set(action.payload.userId, action.payload.username);
      break;
    case 'REMOVE_TYPING_USER':
      draft.typingUsers.delete(action.payload.userId);
      break;
    case 'SET_ONLINE_USERS':
      draft.onlineUsers = action.payload;
      break;
    case 'SET_PINNED_MESSAGES':
      draft.pinnedMessage = action.payload;
      break;
    case 'SET_LOADING':
      draft.loading = action.payload;
      break;
    case 'SET_MUTED_CHAT':
      draft.mutedChat = action.payload;
      break;
    default:
      break;
  }
}

export const useChatState = () => {
  const [state, dispatch] = useImmerReducer(chatReducer, initialState);
  return { state, dispatch };
};