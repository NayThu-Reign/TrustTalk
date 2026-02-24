import React from "react";
import { Typography } from "@mui/material";
import Linkify from "react-linkify";

const mentionSplitRegex = /(@[A-Za-z0-9_ ]+)/g;
const singleMentionRegex = /^@[A-Za-z0-9_ ]+$/;

function MentionText({ text, searchTerm }) {
  const highlightText = (part) => {
    if (!searchTerm) return part;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    return part.split(regex).map((subPart, i) =>
      subPart.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={i} style={{ backgroundColor: "#FAC748", padding: 0 }}>
          {subPart}
        </mark>
      ) : (
        subPart
      )
    );
  };

  const parts = text?.split(mentionSplitRegex);

  return (
    <Typography
      variant="body1"
      sx={{
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        maxWidth: "100%",
        "@media (max-width: 600px)": { maxWidth: "200px" },
        "@media (min-width: 601px)": { maxWidth: "300px" },
      }}
    >
      {parts?.map((part, index) =>
        singleMentionRegex.test(part) ? (
          <span
            key={index}
            style={{
              color: "#1976d2",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {part}
          </span>
        ) : (
          <Linkify
            key={index}
            component="a"
            properties={{
              target: "_blank",
              rel: "noopener noreferrer",
            }}
          >
            {highlightText(part)}
          </Linkify>
        )
      )}
    </Typography>
  );
}

export default React.memo(MentionText);
