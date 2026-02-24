useEffect(() => {
    if (!socket) return;
  
    const handleNewReaction = (reaction) => {
      // update messages with reaction
        setMessages((prevMessages) => {
            // Map over messages and add the reaction to the correct message
            const updatedMessages = prevMessages.map((message) => {
                if (message.id === reaction.message_id) {
                    // Ensure reactions exist, and then add the new reaction
                    return {
                        ...message,
                        reactions: [...(message.reactions || []), reaction], // Add reaction to existing or empty array
                    };
                }
                return message;
            });

            // Sort the messages by 'createdAt' after adding the reaction
            const sortedMessages = [...updatedMessages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            return sortedMessages; // Return the sorted and updated message list
        });
    };
  
    const handleRemoveReaction = ({ messageId, userId }) => {
      // update messages by removing reaction
        setMessages((prevMessages) => {
            // Map over messages and remove the reaction from the correct message
            const updatedMessages = prevMessages.map((message) => {
                if (message.id === messageId) {
                    return {
                        ...message,
                        reactions: (message.reactions || []).filter(
                            (reaction) => reaction.user_id !== userId
                        ), // Remove the reaction for the specific user
                    };
                }
                return message;
            });

            // Sort the messages by 'createdAt' after removing the reaction (if needed)
            const sortedMessages = [...updatedMessages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            return sortedMessages; // Return the sorted and updated message list
        });
    };
  
    const handleUpdatedReaction = (reaction) => {
        setMessages((prevMessages) => {
            // Map over messages and update the reaction in the correct message
            const updatedMessages = prevMessages.map((message) => {
                if (message.id === reaction.message_id) {
                    // Update the reaction if it exists, or add it if it doesn't
                    const updatedReactions = (message.reactions || []).map((r) =>
                        r.user_id === reaction.user_id ? { ...r, reaction_type: reaction.reaction_type } : r
                    );

                    // Check if the user hasn't reacted yet (add the new reaction)
                    const hasReacted = updatedReactions.some((r) => r.user_id === reaction.user_id);
                    if (!hasReacted) {
                        updatedReactions.push(reaction);
                    }

                    return {
                        ...message,
                        reactions: updatedReactions,
                    };
                }
                return message;
            });

            // Sort messages by 'createdAt' (if needed)
            const sortedMessages = [...updatedMessages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            return sortedMessages;
        });
    };
  
    const handleNewMessage = (message) => {
      // update chat with new message
        if(message.chat_id === Number(currentChatId)) {
            setMessages((prevMessages) => {
                const updatedMessages = [...prevMessages, message];
                console.log('Updated messages state:', updatedMessages);
                return updatedMessages;
            });
            console.log("SetMessages", messages);
            setChat((prev) => ({
                ...prev,
                messages: [...(prev.messages || []), message],
            }));

            if (!message.originalMessage) {
                // Fetch chat details if `originalMessage` is missing
                fetchChat();
            }
        } else {
            console.log("hi")
        }
    };
  
    const handleUserPhoto = (updatedUser) => {
      // update user photo logic
      setChat((prevChat) => ({
        ...prevChat,
        participants: prevChat.participants.map((participant) => {
          // If participant's employeeId matches the updatedUser's employeeId, update their photo
          if (participant.employeeId === updatedUser.employeeId) {
            return { ...participant, photo: updatedUser.photo };
          }
          return participant; // Otherwise, keep the participant as is
        }),
      }));
      

      // Check if the updatedUser matches the current user
      if (authUser?.employeeId === updatedUser.employeeId) {
        setAuthUser((prevAuthUser) => ({
          ...prevAuthUser,
          photo: updatedUser.photo,
        }));
      }

      setRecipient((prevUser) => ({
        ...prevUser,
        photo: updatedUser.photo,
      }))
    };

    const handleReadMessage = (data) => {
        console.log('Message read event received:', data);
        
        if (data.chatId === Number(currentChatId)) {
            setMessages((prevMessages) => {
                // Clone the previous messages to avoid direct mutation
                const updatedMessages = [...prevMessages];

                // Find the message that matches the incoming `messageId`
                const messageIndex = updatedMessages.findIndex(msg => msg.id === data.messageId);

                if (messageIndex !== -1) {
                    // Clone the target message to maintain immutability
                    const updatedMessage = { ...updatedMessages[messageIndex] };

                    // Parse `viewedBy` into an array and add `authUser.id` if not present
                    const viewedByArray = JSON.parse(updatedMessage.viewedBy || '[]');
                    if (!viewedByArray.includes(data.userId)) {
                        viewedByArray.push(data.userId);
                    }

                    // Update the `viewedBy` property
                    updatedMessage.viewedBy = JSON.stringify(viewedByArray);

                    // Replace the original message with the updated one
                    updatedMessages[messageIndex] = updatedMessage;
                }

                // Return the updated messages array
                return updatedMessages;
            });
        }
    };
    
    const handleDeleteMessage = ({chatId, messageId}) => {
        if(chatId === currentChatId) {
            setChat((prev) => ({
                ...prev,
                messages: prev.messages.filter(message => message.id !== messageId),
            }));
            fetchChat();
        }
    }

    const handlePinMessage = () => {
        fetchChat();
    }
    const handleUnPinMessage = () => {
        fetchChat();
    }

    const handleGroupPhoto = (updatedGroup) => {
        if (updatedGroup.id === chat?.id) {
            setChat((prevChat) => ({
                ...prevChat,
                photo: updatedGroup.photo
            }));
        }
    }

  
    // Register all listeners
    socket.on("newReaction", handleNewReaction);
    socket.on("removeReaction", handleRemoveReaction);
    socket.on("updatedReaction", handleUpdatedReaction);
    socket.on("newMessage", handleNewMessage);
    socket.on("userPhoto", handleUserPhoto);
    socket.on("readMessage", handleReadMessage);
    socket.on("deleteMessage", handleDeleteMessage);
    socket.on("pinMessage", handlePinMessage);
    socket.on("unPinMessage", handleUnPinMessage);
    socket.on("groupPhoto", handleGroupPhoto);
    
  
    // Cleanup function to remove all listeners on unmount or socket change
    return () => {
      socket.off("newReaction", handleNewReaction);
      socket.off("removeReaction", handleRemoveReaction);
      socket.off("updatedReaction", handleUpdatedReaction);
      socket.off("newMessage", handleNewMessage);
      socket.off("userPhoto", handleUserPhoto);
      socket.off("readMessage", handleReadMessage);
      socket.off("deleteMessage", handleDeleteMessage);
      socket.off("pinMessage", handlePinMessage);
      socket.off("unPinMessage", handleUnPinMessage);
      socket.off("groupPhoto", handleGroupPhoto);
    };
  }, [socket, currentChatId, authUser?.staff_code]);
  