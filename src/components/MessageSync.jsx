import { useCallback, useEffect, useRef, useState } from "react";
import { decryptInWorker } from "../crypto/cryptoClient";
import { useChats } from "../providers/ChatsProvider";
import { fetchWithAuth } from "../hooks/fetchWithAuth";

const api = import.meta.env.VITE_API_URL;

// ✅ Utility functions outside component
function isBase64DataUrl(str) {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('data:') && str.includes('base64');
}

async function blobUrlToBase64(blobUrl, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error(`Fetch failed with status ${response.status}`);
      }
      
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log(`✅ Successfully converted blob to base64 (attempt ${attempt})`);
          resolve(reader.result);
        };
        reader.onerror = () => reject(new Error('FileReader failed'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed:`, error);
      if (attempt === retries) {
        console.error('All conversion attempts failed');
        return null;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 100 * attempt));
    }
  }
}

async function decryptSingleMessage(msg, chatId, decryptMedia) {
  const result = { ...msg };

  console.log("")

  // Decrypt text content
  try {
    if (!result.text_content && result.ciphertext && result.nonce) {
      result.text_content = await decryptInWorker({
        chatId,
        ciphertext: result.ciphertext,
        nonce: result.nonce,
        version: result.key_version,
      });
    }
  } catch (error) {
    return null; 
  }

  // Decrypt media
  try {
    if (!result.text_content && result.media_type) {
      if (
        result.media_type === "gif" ||
        result.media_type === "sticker" ||
        !result.nonce
      ) {
        result.decryptedUrl = result.media_url;
      } else if (result.media_type !== "poll") {
        // Check if already base64

          console.log("result", result);
          // Decrypt media
          const blobUrl = await decryptMedia(result, chatId);

        console.log("blobUrl", blobUrl);

          
          // ✅ ALWAYS convert to base64 for caching
          const base64 = await blobUrlToBase64(blobUrl);
          
          
          if (base64) {
            result.decryptedUrl = base64;
            console.log('✅ Converted to base64 for offline support');
          } else {
            // Fallback to blob (will only work online)
            result.decryptedUrl = blobUrl;
            console.warn('⚠️ Failed to convert to base64, using blob URL');
          }
        
      }
    }
  } catch (error) {
    return null; 
    
  }

  // Decrypt originalMessage if present (reply preview)
  if (result.originalMessage) {
    const decryptedOriginal = await decryptSingleMessage(result.originalMessage, chatId, decryptMedia);
    if (decryptedOriginal) {
      result.originalMessage = decryptedOriginal;
    }
  }

  return result;
}

function deriveMedia(messages) {
  const medias = (messages ?? []).filter(m => ["image", "gif", "sticker"].includes(m?.media_type));
  const files = (messages ?? []).filter(m => m?.media_type === "file");
  return {
    sharedMedias: medias.slice(3),
    medias,
    sharedFiles: files,
    files,
  };
}

// ✅ Main component
function MessageSync({ chatId, visibleMessages = 7 }) {
  const { decryptMedia } = useChats();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBackgroundFetching, setIsBackgroundFetching] = useState(false);
  const [totalCachedMessages, setTotalCachedMessages] = useState(0);
  const [backgroundFetchProgress, setBackgroundFetchProgress] = useState(null);
  const backgroundFetchRef = useRef(null);
  const abortRef = useRef(false);

  const token = localStorage.getItem("token");

  // Fetch from API and update cache
  const fetchFromApi = useCallback(async () => {
    const res = await fetchWithAuth(
      `${api}/api/chats/${chatId}/messages?page=1&limit=${visibleMessages}&includePinned=true`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    if (data.status !== 1) throw new Error('Failed to fetch messages');

    const sortedMessages = data.messages;
    const decryptedMessages = [];
    for (const originalMsg of sortedMessages) {
      const decrypted = await decryptSingleMessage(originalMsg, chatId, decryptMedia);
      if (decrypted) decryptedMessages.push(decrypted);
    }
    const pinnedMsg = data.pinnedMessage
      ? await decryptSingleMessage(data.pinnedMessage, chatId, decryptMedia)
      : null;

      const decryptList = async (list = []) => {
        const result = [];
        for (const item of list) {
          const decrypted = await decryptSingleMessage(item, chatId, decryptMedia);
          if (decrypted) result.push(decrypted);
        }
        return result;
      };

      const decryptedSharedMedias = await decryptList(data.mediaDerived?.sharedMedias);
const decryptedMedias = await decryptList(data.mediaDerived?.medias);
const decryptedSharedFiles = await decryptList(data.mediaDerived?.sharedFiles);
const decryptedFiles = await decryptList(data.mediaDerived?.files);

    const mediaDerived = {
      sharedMedias: decryptedSharedMedias,
      medias: decryptedMedias,
      sharedFiles: decryptedSharedFiles,
      files: decryptedFiles,
    };
    const result = {
      messages: decryptedMessages,
      pinnedMessage: pinnedMsg,
      ...mediaDerived,
      hasMore: data.hasMore,
      isFromCache: false,
    };

    if (window.messageDb) {
      try {
        const messagesToStore = decryptedMessages.map(msg => ({
          id: msg.id, chat_id: chatId, sender_id: msg.sender_id || msg.sender?.user_code,
          recipient_id: msg.recipient_id || null, text_content: msg.text_content || null,
          media_url: msg.media_url || null, media_type: msg.media_type || null, pin: msg.pin || false,
          viewed_by: msg.viewed_by || [], read: msg.read || false, reply_to: msg.reply_to || null,
          edited: msg.edited || false, deleted_by: msg.deleted_by || null,
          is_deleted_for_everyone: msg.is_deleted_for_everyone || false,
          deleted_by_user_id: msg.deleted_by_user_id || null, forwarded_from: msg.forwarded_from || null,
          mentions: msg.mentions || [], ciphertext: msg.ciphertext || null, nonce: msg.nonce || null,
          sender_public_key: msg.sender_public_key || null, key_version: msg.key_version || 1,
          created_at: msg.createdAt, updated_at: msg.updatedAt || msg.createdAt,
          decryptedUrl: msg.decryptedUrl || null, sender: msg.sender || null,
          originalMessage: msg.originalMessage || null, reactions: msg.reactions || [],
          Poll: msg.Poll || null,
        }));
        await window.messageDb.insertMessages(messagesToStore);
        console.log('✅ Updated cache with', messagesToStore.length, 'messages');
      } catch (err) {
        console.error('Failed to update cache:', err);
      }
    }
    return result;
  }, [chatId, visibleMessages, token, decryptMedia]);

 // Load on chat enter: API first, fallback to cache when API fails/empty
const loadMessages = useCallback(async () => {
  if (!chatId) {
    setData(null);
    setIsLoading(false);
    return;
  }

  abortRef.current = false;
  setData(null);
  setIsLoading(true);
  setError(null);

  // 1️⃣ Try API first
  try {
    console.log('🌐 Fetching from API first...');
    const apiResult = await fetchFromApi();

    if (!abortRef.current && apiResult) {
      const { mediaDerived: _omit, ...apiData } = apiResult;
      setData(apiData);
      setIsLoading(false);
      return; // ✅ Success → stop here
    }
  } catch (apiError) {
    console.warn('⚠️ API fetch failed, trying cache...', apiError);
  }

  // 2️⃣ Fallback to cache if API failed or returned nothing
  try {
    const cachedMessages = window.messageDb
      ? await window.messageDb.getMessages(chatId, visibleMessages).catch(() => [])
      : [];

    if (cachedMessages?.length > 0) {
      console.log(`✅ Found ${cachedMessages.length} messages in cache`, cachedMessages);

      const pinnedMsg = cachedMessages.find(m => m.pin);

      let allCached = cachedMessages;
      try {
        const count = await window.messageDb.getMessageCount(chatId);
        allCached =
          (await window.messageDb.getMessages(chatId, count, 0)) || cachedMessages;
      } catch (_) {}

      const cacheData = {
        messages: cachedMessages,
        pinnedMessage: pinnedMsg || null,
        mediaDerived: deriveMedia(allCached),
        hasMore: cachedMessages.length >= visibleMessages,
        isFromCache: true,
      };

      if (!abortRef.current) {
        setData(cacheData);
      }
    } else {
      // No cache either
      if (!abortRef.current) {
        setData(null);
      }
    }
  } catch (cacheError) {
    console.error('❌ Cache fallback failed:', cacheError);
    if (!abortRef.current) {
      setError(cacheError);
      setData(null);
    }
  } finally {
    if (!abortRef.current) setIsLoading(false);
  }
}, [chatId, visibleMessages, fetchFromApi]);

  // Run only on chat enter (chatId change), NOT when loadMessages identity changes.
  // Otherwise loadMessages would re-run (e.g. after load more) and overwrite messages.
  useEffect(() => {
    loadMessages();
    return () => { abortRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);


  const fetchHistoricalMessages = useCallback(async () => {
      if (!chatId || !token || isBackgroundFetching) return;
      
      // Check if already fetched
      if (window.messageDb) {
        const fetchStatus = await window.messageDb.getBackgroundFetchStatus(chatId);
        if (fetchStatus?.is_complete) {
          console.log('✅ Background fetch already complete for this chat');
          return;
        }
        
        if (fetchStatus?.is_fetching) {
          console.log('⏳ Background fetch already in progress');
          return;
        }
      }
      
      setIsBackgroundFetching(true);
      console.log('🔄 Starting background fetch of historical messages...');
      
      // Mark as fetching
      if (window.messageDb) {
        await window.messageDb.updateBackgroundFetchStatus(chatId, {
          is_fetching: true,
          is_complete: false,
          last_fetch_time: Date.now(),
        });
      }
      
      try {
        let page = 2; // Start from page 2 since page 1 is already loaded
        let hasMore = true;
        const batchSize = 50;
        let totalFetched = 0;
        
        while (hasMore) {
          try {
            console.log(`📥 Fetching page ${page}...`);
            
            const res = await fetchWithAuth(
              `${api}/api/chats/${chatId}/messages?page=${page}&limit=${batchSize}&includePinned=false`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
  
            const data = await res.json();
  
            if (data.status !== 1 || !data.messages || data.messages.length === 0) {
              hasMore = false;
              break;
            }
  
            console.log("datafetchingbg0,", data);
  
            // Decrypt batch
            const decryptedBatch = [];
            for (const msg of data.messages) {
              const decrypted = await decryptSingleMessage(msg, chatId,decryptMedia);
              if (decrypted) {
                decryptedBatch.push(decrypted);
              }
            }
  
            // Store in SQLite
            if (window.messageDb && decryptedBatch.length > 0) {
              console.log("decryptedBatch", decryptedBatch);
              const messagesToStore = decryptedBatch.map(msg => ({
                id: msg.id,
                chat_id: chatId,
                sender_id: msg.sender_id || msg.sender?.user_code,
                recipient_id: msg.recipient_id || null,
                text_content: msg.text_content || null,
                media_url: msg.media_url || null,
                media_type: msg.media_type || null,
                pin: msg.pin || false,
                viewed_by: msg.viewed_by || [],
                read: msg.read || false,
                reply_to: msg.reply_to || null,
                edited: msg.edited || false,
                deleted_by: msg.deleted_by || null,
                is_deleted_for_everyone: msg.is_deleted_for_everyone || false,
                deleted_by_user_id: msg.deleted_by_user_id || null,
                forwarded_from: msg.forwarded_from || null,
                mentions: msg.mentions || [],
                ciphertext: msg.ciphertext || null,
                nonce: msg.nonce || null,
                sender_public_key: msg.sender_public_key || null,
                key_version: msg.key_version || 1,
                created_at: msg.createdAt,
                updated_at: msg.updatedAt || msg.createdAt,
                decryptedUrl: msg.decryptedUrl || null,
                sender: msg.sender || null,
                originalMessage: msg.originalMessage || null,
                reactions: msg.reactions || [],
                Poll: msg.Poll || null,
              }));
  
              await window.messageDb.insertMessages(messagesToStore);
              totalFetched += messagesToStore.length;
              
              // Update progress
              await window.messageDb.updateBackgroundFetchStatus(chatId, {
                total_fetched: totalFetched,
                last_fetch_time: Date.now(),
              });
              
              setBackgroundFetchProgress({
                page,
                totalFetched,
                lastBatchSize: messagesToStore.length,
              });

              // Update mediaDerived with all cached messages (current + historical)
              const count = await window.messageDb.getMessageCount(chatId);
              const allCached = await window.messageDb.getMessages(chatId, count, 0);
              setData(prev => prev ? { ...prev, mediaDerived: deriveMedia(allCached) } : prev);
              
              console.log(`📥 Background cached page ${page}: ${messagesToStore.length} messages (total: ${totalFetched})`);
            }
  
            hasMore = data.hasMore;
            page++;
            
            // Add small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (error) {
            console.error(`Failed to fetch page ${page}:`, error);
            hasMore = false;
          }
        }
        
        console.log(`✅ Background fetch complete: ${totalFetched} historical messages cached`);
        
        // Mark as complete
        if (window.messageDb) {
          await window.messageDb.updateBackgroundFetchStatus(chatId, {
            is_fetching: false,
            is_complete: true,
            total_fetched: totalFetched,
            last_fetch_time: Date.now(),
          });
          
          // Update total count
          const count = await window.messageDb.getMessageCount(chatId);
          setTotalCachedMessages(count);
        }
        
      } catch (error) {
        console.error('Background fetch failed:', error);
        
        // Mark as not fetching on error
        if (window.messageDb) {
          await window.messageDb.updateBackgroundFetchStatus(chatId, {
            is_fetching: false,
            last_fetch_time: Date.now(),
          });
        }
      } finally {
        setIsBackgroundFetching(false);
        setBackgroundFetchProgress(null);
      }
    }, [chatId, token, isBackgroundFetching, decryptMedia]);
  
    // 4. Trigger background fetch after initial load
    useEffect(() => {
      if (data && data.hasMore && !isBackgroundFetching) {
        // Wait a bit before starting background fetch
        const timer = setTimeout(() => {
          fetchHistoricalMessages();
        }, 2000);
        
        // Store reference for cleanup
        backgroundFetchRef.current = timer;
        
        return () => {
          if (backgroundFetchRef.current) {
            clearTimeout(backgroundFetchRef.current);
          }
        };
      }
    }, [data, fetchHistoricalMessages, isBackgroundFetching]);
  
    // 5. Cleanup on unmount
    useEffect(() => {
      return () => {
        if (backgroundFetchRef.current) {
          clearTimeout(backgroundFetchRef.current);
        }
      };
    }, []);

  // Fetch a single message by id, decrypt it, replace in cache and state
  const fetchMessage = useCallback(async (messageId) => {
    if (!messageId || !chatId || !token) return;

    try {
      console.log(`🔄 Fetching single message ${messageId}...`);
      const res = await fetchWithAuth(
        `${api}/api/chats/${chatId}/messages/${messageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (json.status !== 1 || !json.message) {
        console.error('❌ Failed to fetch single message:', json);
        return;
      }

      const decrypted = await decryptSingleMessage(json.message, chatId, decryptMedia);
      if (!decrypted) {
        console.error('❌ Failed to decrypt single message');
        return;
      }

      console.log(`✅ Single message fetched and decrypted:`, decrypted);

      // Update cache
      if (window.messageDb) {
        try {
          await window.messageDb.insertMessages([{
            id: decrypted.id, chat_id: chatId,
            sender_id: decrypted.sender_id || decrypted.sender?.user_code,
            recipient_id: decrypted.recipient_id || null,
            text_content: decrypted.text_content || null,
            media_url: decrypted.media_url || null,
            media_type: decrypted.media_type || null,
            pin: decrypted.pin || false,
            viewed_by: decrypted.viewed_by || [], read: decrypted.read || false,
            reply_to: decrypted.reply_to || null, edited: decrypted.edited || false,
            deleted_by: decrypted.deleted_by || null,
            is_deleted_for_everyone: decrypted.is_deleted_for_everyone || false,
            deleted_by_user_id: decrypted.deleted_by_user_id || null,
            forwarded_from: decrypted.forwarded_from || null,
            mentions: decrypted.mentions || [],
            ciphertext: decrypted.ciphertext || null, nonce: decrypted.nonce || null,
            sender_public_key: decrypted.sender_public_key || null,
            key_version: decrypted.key_version || 1,
            created_at: decrypted.createdAt, updated_at: decrypted.updatedAt || decrypted.createdAt,
            decryptedUrl: decrypted.decryptedUrl || null,
            sender: decrypted.sender || null,
            originalMessage: decrypted.originalMessage || null,
            reactions: decrypted.reactions || [], Poll: decrypted.Poll || null,
          }]);
          console.log(`✅ Cache updated for message ${messageId}`);
        } catch (err) {
          console.error('Failed to update cache for single message:', err);
        }
      }

      // Replace message in state
      setData(prev => {
        if (!prev) return prev;
        const updatedMessages = prev.messages.map(m =>
          m.id === messageId ? decrypted : m
        );
        return {
          ...prev,
          messages: updatedMessages,
          mediaDerived: deriveMedia(updatedMessages),
        };
      });
    } catch (err) {
      console.error(`❌ fetchMessage(${messageId}) failed:`, err);
    }
  }, [chatId, token, decryptMedia]);

    return {
        data,
        isLoading,
        error,
        refetch: loadMessages,
        fetchMessage,
        isFromCache: data?.isFromCache || false,
        isOffline: !!error && !data,
        isBackgroundFetching,
        totalCachedMessages,
        backgroundFetchProgress,
        manualBackgroundFetch: fetchHistoricalMessages,
      };
}

export default MessageSync;
