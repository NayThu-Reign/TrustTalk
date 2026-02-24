import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';

const MessagesContext = createContext();

// Action types
const ACTIONS = {
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  DELETE_MESSAGE: 'DELETE_MESSAGE',
  ADD_REACTION: 'ADD_REACTION',
  REMOVE_REACTION: 'REMOVE_REACTION',
  PIN_MESSAGE: 'PIN_MESSAGE',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES'
};

// Reducer for message state management
function messagesReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: action.payload.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      };
    case ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      };
    case ACTIONS.UPDATE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map(msg => 
          msg.id === action.payload.id ? { ...msg, ...action.payload } : msg
        )
      };
    case ACTIONS.DELETE_MESSAGE:
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload)
      };
    case ACTIONS.ADD_REACTION:
      return {
        ...state,
        messages: state.messages.map(msg => 
          msg.id === action.payload.messageId 
            ? { 
                ...msg, 
                reactions: [...(msg.reactions || []), action.payload.reaction]
              } 
            : msg
        )
      };
    case ACTIONS.REMOVE_REACTION:
      return {
        ...state,
        messages: state.messages.map(msg => 
          msg.id === action.payload.messageId 
            ? { 
                ...msg, 
                reactions: (msg.reactions || []).filter(
                  reaction => reaction.user_id !== action.payload.userId
                )
              } 
            : msg
        )
      };
    case ACTIONS.PIN_MESSAGE:
      return {
        ...state,
        messages: state.messages.map(msg => 
          msg.id === action.payload.messageId 
            ? { ...msg, pin: action.payload.isPinned } 
            : msg
        )
      };
    case ACTIONS.CLEAR_MESSAGES:
      return {
        ...state,
        messages: []
      };
    default:
      return state;
  }
}

export function MessagesProvider({ children }) {
  const { socket } = useAuth();
  const [state, dispatch] = useReducer(messagesReducer, { messages: [] });

  // Message actions
  const setMessages = useCallback((messages) => {
    dispatch({ type: ACTIONS.SET_MESSAGES, payload: messages });
  }, []);

  const addMessage = useCallback((message) => {
    dispatch({ type: ACTIONS.ADD_MESSAGE, payload: message });
  }, []);

  const updateMessage = useCallback((message) => {
    dispatch({ type: ACTIONS.UPDATE_MESSAGE, payload: message });
  }, []);

  const deleteMessage = useCallback((messageId) => {
    dispatch({ type: ACTIONS.DELETE_MESSAGE, payload: messageId });
  }, []);

  const addReaction = useCallback((messageId, reaction) => {
    dispatch({ type: ACTIONS.ADD_REACTION, payload: { messageId, reaction } });
  }, []);

  const removeReaction = useCallback((messageId, userId) => {
    dispatch({ type: ACTIONS.REMOVE_REACTION, payload: { messageId, userId } });
  }, []);

  const pinMessage = useCallback((messageId, isPinned) => {
    dispatch({ type: ACTIONS.PIN_MESSAGE, payload: { messageId, isPinned } });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_MESSAGES });
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('newMessage', addMessage);
    socket.on('messageUpdated', updateMessage);
    socket.on('messageDeleted', deleteMessage);
    socket.on('newReaction', ({ message_id, reaction }) => addReaction(message_id, reaction));
    socket.on('removeReaction', ({ messageId, userId }) => removeReaction(messageId, userId));
    socket.on('messagePinned', ({ messageId, isPinned }) => pinMessage(messageId, isPinned));

    return () => {
      socket.off('newMessage');
      socket.off('messageUpdated');
      socket.off('messageDeleted');
      socket.off('newReaction');
      socket.off('removeReaction');
      socket.off('messagePinned');
    };
  }, [socket, addMessage, updateMessage, deleteMessage, addReaction, removeReaction, pinMessage]);

  const value = {
    messages: state.messages,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    pinMessage,
    clearMessages
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
}

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};
