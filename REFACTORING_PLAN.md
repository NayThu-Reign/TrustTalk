# Refactoring Plan for Conversation.jsx and ChatsProvider.jsx

## Current Issues

### Conversation.jsx (4995 lines)
1. **Too many responsibilities**: UI rendering, state management, API calls, encryption/decryption, socket handling
2. **Massive component**: Should be broken into 15-20 smaller components
3. **Duplicate code**: Similar patterns for different message types
4. **Complex state management**: 30+ useState hooks
5. **Large useEffect hooks**: Complex side effects that should be extracted
6. **Inline styles and logic**: Hard to maintain and test
7. **Mixed concerns**: Business logic mixed with presentation

### ChatsProvider.jsx (1499 lines)
1. **Too many socket handlers**: Should be extracted to custom hooks
2. **Complex state updates**: Using immer produce extensively
3. **Mixed concerns**: Socket logic, state management, and business logic together

## Refactoring Strategy

### Phase 1: Extract Custom Hooks

#### 1.1 Message Management Hook
```javascript
// hooks/useMessageManagement.js
- handleDeleteMessage
- handlePinMessage
- handleUnPinMessage
- handleEditMessage
- handleReply
- handleCopyMessage
```

#### 1.2 Scroll Management Hook
```javascript
// hooks/useScrollManagement.js
- isAtBottom state
- shouldScrollToBottom state
- scrollToBottom function
- scrollToMessage function
- loadMoreMessages function
```

#### 1.3 Search Hook
```javascript
// hooks/useMessageSearch.js
- searchTerm state
- searchResults state
- currentIndex state
- handleSearch function
- navigateResult function
```

#### 1.4 Media Management Hook
```javascript
// hooks/useMediaManagement.js
- decryptImage
- decryptVideo
- decryptMedia
- handleFileDownload
- mediaUrl, mediaType states
```

#### 1.5 Reaction Management Hook
```javascript
// hooks/useReactionManagement.js
- handleOpenReactionPicker
- handleReactionSelect
- handleRemoveReaction
- userReaction state
```

#### 1.6 UI State Hook
```javascript
// hooks/useConversationUI.js
- All drawer states (isChatInfoOpen, isSharedFileOpen, etc.)
- Menu states
- Dialog states
- Hover states
```

### Phase 2: Extract Components

#### 2.1 Message Components
```
components/chat/messages/
  ├── MessageBubble.jsx          (Main message bubble)
  ├── MessageContent.jsx         (Text/image/file content)
  ├── MessageActions.jsx         (Menu with edit/delete/etc)
  ├── MessageReactions.jsx       (Reaction picker and display)
  ├── MessageReply.jsx          (Reply preview)
  ├── MessageStatus.jsx         (Seen/Sent indicators)
  ├── MessageTime.jsx           (Timestamp)
  └── MessageTypes/
      ├── TextMessage.jsx
      ├── ImageMessage.jsx
      ├── FileMessage.jsx
      ├── VideoMessage.jsx
      ├── AudioMessage.jsx
      └── PollMessage.jsx
```

#### 2.2 Header Components
```
components/chat/header/
  ├── ChatHeader.jsx             (Main header - already exists)
  ├── ChatAvatar.jsx             (Avatar with online status)
  ├── ChatTitle.jsx              (Name and subtitle)
  ├── ChatActions.jsx            (Search, info, files buttons)
  └── SearchBar.jsx              (Search input with navigation)
```

#### 2.3 Sidebar Components
```
components/chat/sidebar/
  ├── ChatInfoSidebar.jsx        (Chat info drawer)
  ├── SharedFilesSidebar.jsx     (Files list)
  ├── MediaSidebar.jsx            (Media gallery)
  └── ParticipantList.jsx        (Participants management)
```

#### 2.4 Utility Components
```
components/chat/utils/
  ├── PinnedMessage.jsx          (Pinned message banner)
  ├── DateSeparator.jsx          (Date labels)
  ├── ScrollToBottom.jsx         (Scroll button)
  ├── NewMessageIndicator.jsx    (New message notification)
  └── FullscreenImage.jsx        (Image overlay)
```

### Phase 3: Extract Services

#### 3.1 Message Service
```javascript
// services/messageService.js
- sendMessage
- editMessage
- deleteMessage
- pinMessage
- unpinMessage
- markAsRead
- forwardMessage
```

#### 3.2 Media Service
```javascript
// services/mediaService.js
- decryptImage
- decryptVideo
- decryptAudio
- decryptFile
- handleFileDownload
- uploadMedia
```

#### 3.3 Chat Service
```javascript
// services/chatService.js
- fetchChat
- updateChatPhoto
- muteChat
- unmuteChat
- addParticipant
- removeParticipant
- leaveChat
```

### Phase 4: Refactor ChatsProvider

#### 4.1 Extract Socket Hooks
```javascript
// hooks/useChatSocket.js (already exists, enhance it)
// hooks/useChatListSocket.js
// hooks/useUserStatusSocket.js
```

#### 4.2 Extract State Management
```javascript
// hooks/useChatState.js (already exists, enhance it)
// hooks/useMessageState.js
// hooks/useParticipantState.js
```

### Phase 5: Create Utility Functions

#### 5.1 Message Utilities
```javascript
// utils/messageUtils.js
- formatMessageDate
- groupMessagesByDate
- isMessageFromUser
- getMessageType
- shouldShowTimestamp
```

#### 5.2 Formatting Utilities
```javascript
// utils/formatUtils.js
- formatDate
- formatTime
- formatFileSize
```

#### 5.3 Validation Utilities
```javascript
// utils/validationUtils.js
- validateMessage
- validateFile
- validateMedia
```

## Implementation Order

1. **Week 1**: Extract hooks (useMessageManagement, useScrollManagement, etc.)
2. **Week 2**: Extract message components (MessageBubble, MessageContent, etc.)
3. **Week 3**: Extract header and sidebar components
4. **Week 4**: Extract services (messageService, mediaService, etc.)
5. **Week 5**: Refactor ChatsProvider and extract socket hooks
6. **Week 6**: Testing and optimization

## File Structure After Refactoring

```
frontend/src/
├── pages/
│   └── Conversation.jsx          (Main container, ~200 lines)
├── components/
│   └── chat/
│       ├── header/
│       ├── messages/
│       ├── sidebar/
│       └── utils/
├── hooks/
│   ├── useMessageManagement.js
│   ├── useScrollManagement.js
│   ├── useMessageSearch.js
│   ├── useMediaManagement.js
│   ├── useReactionManagement.js
│   └── useConversationUI.js
├── services/
│   ├── messageService.js
│   ├── mediaService.js
│   └── chatService.js
└── utils/
    ├── messageUtils.js
    ├── formatUtils.js
    └── validationUtils.js
```

## Benefits

1. **Maintainability**: Smaller, focused files are easier to understand and modify
2. **Testability**: Isolated functions and components are easier to test
3. **Reusability**: Components and hooks can be reused across the app
4. **Performance**: Better code splitting and memoization opportunities
5. **Developer Experience**: Easier to onboard new developers
6. **Bug Fixing**: Easier to locate and fix issues

## Migration Strategy

1. Create new components alongside old code
2. Gradually replace sections of Conversation.jsx
3. Keep old code commented for reference
4. Test thoroughly after each migration
5. Remove old code once migration is complete

