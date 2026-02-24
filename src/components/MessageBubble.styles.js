// MessageBubble.styles.js - Centralized Styles
// All inline styles extracted to constants for performance

export const messageStyles = {
  systemMessage: {
    display: "flex",
    justifyContent: "center",
    paddingTop: "10px",
  },

  messageContainer: (isOwnMessage, isHighlighted) => ({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: isOwnMessage ? "flex-end" : "flex-start",
    padding: "8px 16px",
    backgroundColor: isHighlighted ? "rgba(25, 118, 210, 0.08)" : "transparent",
    transition: "background-color 0.3s ease",
    "&:hover": {
      backgroundColor: isHighlighted 
        ? "rgba(25, 118, 210, 0.12)" 
        : "rgba(0, 0, 0, 0.02)",
    },
  }),
};

export const contentStyles = {
  container: (isOwnMessage) => ({
    maxWidth: "70%",
    padding: "12px 16px",
    borderRadius: "12px",
    backgroundColor: isOwnMessage ? "#1976d2" : "#f5f5f5",
    color: isOwnMessage ? "#fff" : "#000",
    position: "relative",
  }),

  senderInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },

  avatar: {
    width: 24,
    height: 24,
    fontSize: "12px",
  },

  senderName: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#1976d2",
  },

  repliedMessage: {
    padding: "8px",
    marginBottom: "8px",
    borderLeft: "3px solid #1976d2",
    backgroundColor: "rgba(25, 118, 210, 0.08)",
    borderRadius: "4px",
  },

  repliedSender: {
    fontWeight: 600,
    color: "#1976d2",
  },

  repliedText: {
    fontSize: "14px",
    color: "#666",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "4px",
  },

  timestamp: {
    fontSize: "11px",
    opacity: 0.7,
  },

  editedLabel: {
    fontSize: "11px",
    fontStyle: "italic",
    opacity: 0.7,
  },

  statusIcon: {
    fontSize: "14px",
    opacity: 0.7,
  },

  viewedCount: {
    fontSize: "11px",
    opacity: 0.7,
  },

  readReceipt: {
    fontSize: "14px",
    opacity: 0.7,
    color: "#1976d2",
  },

  sentReceipt: {
    fontSize: "14px",
    opacity: 0.7,
  },

  failedIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "4px",
  },

  errorIcon: {
    fontSize: "16px",
    color: "#d32f2f",
  },

  retryIcon: {
    fontSize: "16px",
    color: "#1976d2",
    cursor: "pointer",
    "&:hover": {
      opacity: 0.7,
    },
  },

  fileAttachment: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    borderRadius: "8px",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },

  fileName: {
    fontSize: "14px",
    fontWeight: 500,
  },

  downloadIcon: {
    fontSize: "20px",
    cursor: "pointer",
    color: "#1976d2",
    "&:hover": {
      opacity: 0.7,
    },
  },
};

export const actionStyles = {
  quickActions: (isOwnMessage) => ({
    position: "absolute",
    top: "50%",
    [isOwnMessage ? "left" : "right"]: "-80px",
    transform: "translateY(-50%)",
    display: "flex",
    gap: "4px",
    backgroundColor: "#fff",
    borderRadius: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    padding: "4px",
    zIndex: 10,
  }),

  quickActionButton: {
    padding: "6px",
    "&:hover": {
      backgroundColor: "rgba(25, 118, 210, 0.08)",
    },
  },

  menu: {
    "& .MuiPaper-root": {
      borderRadius: "12px",
      minWidth: "200px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    },
  },

  menuItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    "&:hover": {
      backgroundColor: "rgba(25, 118, 210, 0.08)",
    },
  },

  menuItemText: {
    fontSize: "14px",
    fontWeight: 400,
    color: "#121660",
  },

  menuItemIcon: {
    fontSize: "20px",
    color: "#666",
  },

  divider: {
    height: "1px",
    backgroundColor: "#e0e0e0",
    margin: "8px 0",
  },

  deleteMenuItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    "&:hover": {
      backgroundColor: "rgba(211, 47, 47, 0.08)",
    },
  },

  deleteMenuItemText: {
    fontSize: "14px",
    fontWeight: 400,
    color: "#FF3B30",
  },

  deleteMenuItemIcon: {
    fontSize: "20px",
    color: "#FF3B30",
  },
};

export const reactionStyles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "4px",
  },

  summary: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
    "&:hover": {
      opacity: 0.8,
    },
  },

  bubble: (isUserReaction) => ({
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 8px",
    borderRadius: "12px",
    backgroundColor: isUserReaction 
      ? "rgba(25, 118, 210, 0.2)" 
      : "rgba(0, 0, 0, 0.05)",
    border: isUserReaction 
      ? "1px solid #1976d2" 
      : "1px solid transparent",
  }),

  emoji: {
    fontSize: "16px",
  },

  count: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#666",
  },

  othersCount: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#666",
    padding: "2px 8px",
    borderRadius: "12px",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },

  addButton: {
    padding: "4px",
    "&:hover": {
      backgroundColor: "rgba(25, 118, 210, 0.08)",
    },
  },

  picker: {
    "& .MuiPaper-root": {
      borderRadius: "24px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    },
  },

  pickerContainer: {
    display: "flex",
    gap: "4px",
    padding: "8px",
  },

  pickerButton: (isSelected) => ({
    padding: "8px",
    transform: isSelected ? "scale(1.2)" : "scale(1)",
    transition: "transform 0.2s ease",
    "&:hover": {
      transform: "scale(1.3)",
      backgroundColor: "rgba(25, 118, 210, 0.08)",
    },
  }),

  pickerEmoji: {
    fontSize: "24px",
  },
};
