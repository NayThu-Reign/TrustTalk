import React, { useState, useEffect } from 'react';

/**
 * Utility function to check if a string is a base64 data URL
 * @param {string} str - The string to check
 * @returns {boolean} True if the string is a base64 data URL
 */
export function isBase64DataUrl(str) {
  return str && typeof str === 'string' && str.startsWith('data:');
}

/**
 * ChatImage component for displaying encrypted/decrypted images in chat
 * @param {Object} props
 * @param {Object} props.item - Message item containing decryptedUrl
 * @param {Function} props.openFullscreen - Callback to open image in fullscreen
 */
export const ChatImage = React.memo(({ item, openFullscreen }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imageSrc = item.decryptedUrl;

  return (
    <div style={{ position: "relative", minHeight: "200px" }}>
      {!loaded && !error && imageSrc && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          Loading...
        </div>
      )}
      {error && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "red",
          }}
        >
          Failed to load image
        </div>
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          style={{
            width: "100%",
            maxWidth: "400px",
            minHeight: "auto",
            borderRadius: "8px",
            display: loaded ? "block" : "none",
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          onClick={() => openFullscreen(imageSrc)}
          alt="Chat media"
        />
      )}
    </div>
  );
});

ChatImage.displayName = 'ChatImage';

/**
 * ChatVideo component for displaying encrypted/decrypted videos in chat
 * @param {Object} props
 * @param {Object} props.item - Message item containing decryptedUrl
 */
export const ChatVideo = React.memo(({ item }) => {
  const [videoSrc, setVideoSrc] = useState(null);

  useEffect(() => {
    if (!item.decryptedUrl) return;

    if (isBase64DataUrl(item.decryptedUrl) || item.decryptedUrl.startsWith('blob:')) {
      setVideoSrc(item.decryptedUrl);
    } else {
      setVideoSrc(item.decryptedUrl);
    }
  }, [item.decryptedUrl]);

  if (!videoSrc) return null;
  
  return <video src={videoSrc} controls style={{ width: 300 }} />;
});

ChatVideo.displayName = 'ChatVideo';

/**
 * ChatAudio component for displaying encrypted/decrypted audio in chat
 * @param {Object} props
 * @param {Object} props.item - Message item containing decryptedUrl
 */
export const ChatAudio = React.memo(({ item }) => {
  const [audioSrc, setAudioSrc] = useState(null);

  useEffect(() => {
    if (!item.decryptedUrl) return;

    if (isBase64DataUrl(item.decryptedUrl) || item.decryptedUrl.startsWith('blob:')) {
      setAudioSrc(item.decryptedUrl);
    } else {
      setAudioSrc(item.decryptedUrl);
    }
  }, [item.decryptedUrl]);

  if (!audioSrc) return null;
  
  return <audio src={audioSrc} controls style={{ width: 250 }} />;
});

ChatAudio.displayName = 'ChatAudio';
