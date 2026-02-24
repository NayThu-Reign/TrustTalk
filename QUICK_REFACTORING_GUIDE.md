# Quick Refactoring Guide

## 🎯 Goal
Break down `Conversation.jsx` (4995 lines) into smaller, maintainable pieces.

## 📋 Checklist

### Phase 1: Extract Utilities (Start Here - Low Risk)
- [ ] Move `formatMessageDate` → `utils/messageUtils.js`
- [ ] Move `formatTime` → `utils/messageUtils.js`
- [ ] Move `formatDate` → `utils/messageUtils.js`
- [ ] Move `groupMessagesByDate` → `utils/messageUtils.js`
- [ ] Move `extractFileName` → `utils/messageUtils.js`
- [ ] Test utilities work correctly

### Phase 2: Extract Services (Low Risk)
- [ ] Create `services/messageService.js` (example provided)
- [ ] Move all API calls from Conversation.jsx to service
- [ ] Update Conversation.jsx to use service
- [ ] Test API calls still work

### Phase 3: Extract Hooks (Medium Risk)
- [ ] Create `hooks/useMessageManagement.js` (example provided)
- [ ] Create `hooks/useScrollManagement.js` (example provided)
- [ ] Create `hooks/useMessageSearch.js`
- [ ] Create `hooks/useMediaManagement.js`
- [ ] Create `hooks/useReactionManagement.js`
- [ ] Create `hooks/useConversationUI.js`
- [ ] Test each hook independently

### Phase 4: Extract Components (Medium Risk)
- [ ] Create `components/chat/messages/MessageBubble.jsx` (example provided)
- [ ] Create `components/chat/messages/MessageContent.jsx`
- [ ] Create `components/chat/messages/MessageActions.jsx`
- [ ] Create `components/chat/utils/PinnedMessage.jsx`
- [ ] Create `components/chat/utils/DateSeparator.jsx`
- [ ] Test components render correctly

### Phase 5: Refactor Main Component (High Risk)
- [ ] Replace inline logic with hooks
- [ ] Replace inline JSX with components
- [ ] Replace API calls with services
- [ ] Replace utility functions with imports
- [ ] Test full conversation flow

## 🔧 Quick Commands

### Create a new hook
```bash
# Template
touch src/hooks/use[FeatureName].js
```

### Create a new service
```bash
# Template
touch src/services/[feature]Service.js
```

### Create a new component
```bash
# Template
mkdir -p src/components/chat/[category]
touch src/components/chat/[category]/[ComponentName].jsx
```

## 📝 Code Patterns

### Hook Pattern
```javascript
import { useState, useCallback } from 'react';

export const useFeatureName = (dependencies) => {
  const [state, setState] = useState(initialValue);
  
  const handleAction = useCallback(() => {
    // Logic here
  }, [dependencies]);
  
  return {
    state,
    handleAction,
    // ... other exports
  };
};
```

### Service Pattern
```javascript
import { fetchWithAuth } from '../hooks/fetchWithAuth';

const api = import.meta.env.VITE_API_URL;
const token = localStorage.getItem('token');

export const featureService = {
  async operationName(params) {
    const response = await fetchWithAuth(`${api}/endpoint`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(params)
    });
    
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Operation failed');
  }
};
```

### Component Pattern
```javascript
import React from 'react';
import { Box } from '@mui/material';

const ComponentName = ({ prop1, prop2, onAction }) => {
  return (
    <Box>
      {/* Component JSX */}
    </Box>
  );
};

export default React.memo(ComponentName);
```

## 🧪 Testing Checklist

For each extracted piece:
- [ ] Unit test written
- [ ] Test passes
- [ ] Edge cases covered
- [ ] Error handling tested

## 📊 Progress Tracking

### Current State
- Conversation.jsx: **4995 lines**
- ChatsProvider.jsx: **1499 lines**

### Target State
- Conversation.jsx: **~200 lines** (main container)
- Hooks: **~100-200 lines each** (6-8 hooks)
- Components: **~50-150 lines each** (15-20 components)
- Services: **~50-100 lines each** (3-4 services)
- Utils: **~50-100 lines each** (2-3 utils)

## 🚨 Common Pitfalls

1. **Don't refactor everything at once** - Do it incrementally
2. **Don't skip tests** - Test after each extraction
3. **Don't break existing functionality** - Keep old code until new works
4. **Don't over-abstract** - Keep it simple
5. **Don't forget dependencies** - Check all imports

## 💡 Tips

1. **Start small** - Extract one function at a time
2. **Test frequently** - After each change
3. **Use git** - Commit after each successful extraction
4. **Document** - Comment complex logic
5. **Ask for help** - Don't get stuck

## 📚 Resources

- See `REFACTORING_PLAN.md` for detailed strategy
- See `REFACTORING_EXAMPLES.md` for before/after examples
- See `REFACTORING_SUMMARY.md` for overview

## ✅ Success Criteria

Refactoring is complete when:
- [ ] Conversation.jsx is under 300 lines
- [ ] All functionality still works
- [ ] All tests pass
- [ ] Code is easier to understand
- [ ] New features are easier to add

