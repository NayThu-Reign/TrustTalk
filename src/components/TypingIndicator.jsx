function TypingIndicator({ typingUsers }) {
  if (typingUsers.size === 0) return null

  return (
    <div className="typing-indicator">
      <span className="typing-text">
        {Array.from(typingUsers.values()).join(", ")} {typingUsers.size === 1 ? "is" : "are"} typing
      </span>
      <div className="dots-container">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
      <StyleSheet />
    </div>
  )
}

function StyleSheet() {
  return (
    <style jsx>{`
      .typing-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        margin: 8px 0;
      }

      .typing-text {
        font-size: 14px;
        color: var(--text, #000);
      }

      .dots-container {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 4px;
      }

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: rgb(108, 190, 245);
        animation: pulse 1.2s ease-in-out infinite;
      }

      .dot:nth-child(2) {
        animation-delay: 0.2s;
      }

      .dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 0.6;
        }
        50% {
          transform: scale(1.5);
          opacity: 1;
        }
      }
    `}</style>
  )
}


export default TypingIndicator
