import { useEffect } from 'react';

export const useChatSocket = (socket, currentChatId, handlers) => {
    useEffect(() => {
        if (!socket || !currentChatId) return;

        // Join chat room
        socket.emit('joinChat', currentChatId);

        // Message handlers
        socket.on('newMessage', handlers.onNewMessage);
        socket.on('readMessage', handlers.onReadMessage);
        socket.on('deleteMessage', handlers.onDeleteMessage);
        socket.on('editMessage', handlers.onEditMessage);

        // Reaction handlers
        socket.on('newReaction', handlers.onNewReaction);
        socket.on('removeReaction', handlers.onRemoveReaction);
        socket.on('updatedReaction', handlers.onUpdateReaction);

        // User status handlers
        socket.on('userConnected', handlers.onUserConnected);
        socket.on('userDisconnected', handlers.onUserDisconnected);
        socket.on('userTyping', handlers.onUserTyping);
        socket.on('userPhoto', handlers.onUserPhotoUpdate);

        // Cleanup
        return () => {
            socket.emit('leaveChat', currentChatId);
            socket.off('newMessage');
            socket.off('readMessage');
            socket.off('deleteMessage');
            socket.off('editMessage');
            socket.off('newReaction');
            socket.off('removeReaction');
            socket.off('updatedReaction');
            socket.off('userConnected');
            socket.off('userDisconnected');
            socket.off('userTyping');
            socket.off('userPhoto');
        };
    }, [socket, currentChatId, handlers]);
};
