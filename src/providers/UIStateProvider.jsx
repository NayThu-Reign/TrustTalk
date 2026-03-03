import { useState, createContext, useContext, useEffect, useCallback } from "react";

const UIStateContext = createContext();

export function useUIState() {
	return useContext(UIStateContext);
}

export default function UIStateProvider({ children }) {

	const [ isGroupChatOpen, setIsGroupChatOpen ] = useState(false);
	const [ isReactionDrawerOpen, setIsReactionDrawerOpen ] = useState(false);
	const [ activeChatId, setActiveChatId ] = useState(null);
	const [ drafts, setDrafts ] = useState({});
	
	return (
		<UIStateContext.Provider
			value={{
				isGroupChatOpen,
				setIsGroupChatOpen,		
				isReactionDrawerOpen,
				setIsReactionDrawerOpen,
				activeChatId,
				setActiveChatId,
				drafts,
				setDrafts,
			}}
		>
			{children}
		</UIStateContext.Provider>
	);
}