import React, { useState, useEffect } from "react";

function getISTNow() {
  const now = new Date();
  return new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
}

function getTimeUntilMidnightIST() {
  const istNow = getISTNow();

  const nextMidnightIST = new Date(istNow);
  nextMidnightIST.setUTCHours(24, 0, 0, 0);

  const diffMs = nextMidnightIST.getTime() - istNow.getTime();
  return Math.max(0, diffMs);
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export default function CountdownTimer() {
  const [remaining, setRemaining] = useState(getTimeUntilMidnightIST);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getTimeUntilMidnightIST());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center text-gray-500 text-base font-medium py-2">
      <span role="img" aria-label="clock">
        🕐
      </span>{" "}
      Next check-in in{" "}
      <span className="font-mono text-gray-700">{formatTime(remaining)}</span>
    </div>
  );
}
