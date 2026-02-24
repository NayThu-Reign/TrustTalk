import { useState, useEffect, useRef } from "react";
import { Typography } from "@mui/material";

function timeAgo(logoutTime) {
  if (!logoutTime) return "";

  const logoutDate = new Date(logoutTime);
  const now = new Date();
  const diffInSeconds = Math.floor((now - logoutDate) / 1000);

  const seconds = 60;
  const minutes = 60;
  const hours = 24;
  const days = 30;
  const months = 12;

  if (diffInSeconds < seconds) {
    return "moment ago";
  } else if (diffInSeconds < seconds * minutes) {
    const mins = Math.floor(diffInSeconds / seconds);
    return mins === 1 ? "1 minute ago" : `${mins} minutes ago`;
  } else if (diffInSeconds < seconds * minutes * hours) {
    const hrs = Math.floor(diffInSeconds / (seconds * minutes));
    return hrs === 1 ? "1 hour ago" : `${hrs} hours ago`;
  } else if (diffInSeconds < seconds * minutes * hours * days) {
    const daysAgo = Math.floor(diffInSeconds / (seconds * minutes * hours));
    return daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`;
  } else if (diffInSeconds < seconds * minutes * hours * days * months) {
    const monthsAgo = Math.floor(diffInSeconds / (seconds * minutes * hours * days));
    return monthsAgo === 1 ? "1 month ago" : `${monthsAgo} months ago`;
  } else {
    const yearsAgo = Math.floor(diffInSeconds / (seconds * minutes * hours * days * months));
    return yearsAgo === 1 ? "1 year ago" : `${yearsAgo} years ago`;
  }
}

export default function TimeAgo({ logoutTime }) {
  const [timeAgoString, setTimeAgoString] = useState(() => timeAgo(logoutTime));
  const intervalIdRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      setTimeAgoString(timeAgo(logoutTime));
    };

    const startInterval = (ms) => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      intervalIdRef.current = setInterval(updateTime, ms);
    };

    // Run immediately
    updateTime();

    // Check initial diff
    const initialDiff = Math.floor((new Date() - new Date(logoutTime)) / 1000);
    if (initialDiff < 60) {
      // Update every second until 1 min has passed
      startInterval(1000);

      // After hitting 60 seconds, switch to 1-min updates
      setTimeout(() => {
        updateTime();
        startInterval(60000);
      }, (60 - initialDiff) * 1000);
    } else {
      // Already past 1 min → update every minute
      startInterval(60000);
    }

    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [logoutTime]);

  return (
    <Typography
      sx={{
        fontSize: "14px",
        fontWeight: "400",
        color: "#A8A8A8",
      }}
    >
      {timeAgoString}
    </Typography>
  );
}
