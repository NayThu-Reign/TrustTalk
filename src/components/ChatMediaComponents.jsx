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
export const ChatImage = React.memo(({ item, openFullscreen, fetchMessage }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const imageSrc = item.decryptedUrl;

  const handleRetry = async () => {
    setRetrying(true);
    setError(false);
    setLoaded(false);
    await fetchMessage(item.id);
    setRetrying(false);
  };

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
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ color: "red", fontSize: "13px" }}>Failed to load image</span>
          <button
            onClick={handleRetry}
            disabled={retrying}
            style={{
              background: "none",
              border: "1px solid #ccc",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              cursor: retrying ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: retrying ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}
            title="Retry"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: retrying ? "spin 1s linear infinite" : "none",
              }}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
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
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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
