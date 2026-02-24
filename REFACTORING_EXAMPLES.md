# Refactoring Examples

This document shows before/after examples of the refactoring.

## Example 1: Message Management Logic

### Before (in Conversation.jsx)
```javascript
// 648 lines of mixed logic
const handleDeleteMessage = async () => {
  if(selectedMessageId) {
    try {
      const response = await fetchWithAuth(`${api}/api/messages/${currentChatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({messageId: selectedMessageId})
      })
      // ... more code
    } catch (error) {
      // ... error handling
    }
  }
}

const handlePinMessage = async (messageId) => {
  // ... similar pattern
}

// ... 20+ more similar functions
```

### After (using custom hook)
```javascript
// In Conversation.jsx
import { useMessageManagement } from '../hooks/useMessageManagement';

const Conversation = () => {
  const {
    handleDeleteMessage,
    handlePinMessage,
    handleEditMessage,
    handleReply,
    // ... all message operations
  } = useMessageManagement(currentChatId, socket, fetchChat);
  
  // Component is now much cleaner
}
```

## Example 2: Scroll Management

### Before
```javascript
// Multiple useState and useEffect scattered throughout
const [isAtBottom, setIsAtBottom] = useState(true);
const [newMessageReceived, setNewMessageReceived] = useState(false);
const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
// ... 5 more scroll-related states

useEffect(() => {
  // 50+ lines of scroll logic
}, [/* many dependencies */]);

useEffect(() => {
  // Another 30+ lines
}, [/* more dependencies */]);
```

### After
```javascript
// Single hook encapsulates all scroll logic
import { useScrollManagement } from '../hooks/useScrollManagement';

const Conversation = () => {
  const {
    containerRef,
    isAtBottom,
    newMessageReceived,
    scrollToBottom,
    loadMoreMessages,
    // ... all scroll functionality
  } = useScrollManagement(messages, currentChatId, fullscreenImage);
}
```

## Example 3: Message Rendering

### Before
```javascript
// 2000+ lines of JSX with inline logic
{items.map((item, index) => {
  // 100+ lines of conditional rendering
  if (item.type === "message") {
    return (
      <Box>
        {/* 500+ lines of nested JSX */}
        {item.media_url && item.media_type === 'gif' ? (
          <img src={item.media_url} />
        ) : item.media_type === 'image' ? (
          <img src={`${api}/${item.media_url}`} />
        ) : item.media_type === 'file' ? (
          <Box>
            {/* 50+ lines */}
          </Box>
        ) : item.text_content !== null ? (
          <MentionText text={item.text_content} />
        ) : /* ... more conditions */
      </Box>
    );
  }
})}
```

### After
```javascript
// Clean component structure
import MessageBubble from '../components/chat/messages/MessageBubble';
import MessageContent from '../components/chat/messages/MessageContent';

{items.map((item) => {
  if (item.type === "message") {
    return (
      <MessageBubble
        key={item.id}
        message={item}
        authUser={authUser}
        chat={chat}
        recipient={recipient}
        onMediaClick={openFullscreen}
      />
    );
  }
})}

// MessageContent.jsx handles all media types internally
```

## Example 4: API Calls

### Before
```javascript
// API calls scattered throughout component
const handlePinMessage = async (messageId) => {
  try {
    const response = await fetchWithAuth(`${api}/api/messages/pin/${messageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    // ... error handling
  } catch (error) {
    // ...
  }
}
```

### After
```javascript
// Centralized in service
import { messageService } from '../services/messageService';

const handlePinMessage = async (messageId) => {
  try {
    await messageService.pinMessage(messageId);
    // Success handling
  } catch (error) {
    // Error handling
  }
}
```

## Example 5: Utility Functions

### Before
```javascript
// Inline utility functions in component
const formatMessageDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if(isToday(date)) {
    return 'Today'
  } else if ( isYesterday(date)) {
    return 'Yesterday'
  } else {
    return format(date, "MMM d");
  }
}

// Used once in component
const groupedMessages = visibleMessageList.reduce((acc, message) => {
  const formattedDate = formatMessageDate(message.createdAt);
  // ...
}, {});
```

### After
```javascript
// Reusable utility
import { formatMessageDate, groupMessagesByDate } from '../utils/messageUtils';

const groupedMessages = groupMessagesByDate(visibleMessageList);
```

## Benefits Demonstrated

1. **Reduced Complexity**: 4995 lines → ~200 lines main component
2. **Reusability**: Hooks and services can be used elsewhere
3. **Testability**: Each piece can be tested independently
4. **Maintainability**: Changes are isolated to specific files
5. **Readability**: Clear separation of concerns

## Migration Path

1. Start with utilities (low risk, high value)
2. Extract hooks (reusable logic)
3. Create services (API calls)
4. Break down components (UI)
5. Refactor main component last

