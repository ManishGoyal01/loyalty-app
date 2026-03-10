import React from "react";

const sizeClasses = {
  sm: "w-3 h-3",
  md: "w-5 h-5",
  lg: "w-7 h-7",
};

export default function StreakDots({ streak = 0, size = "md" }) {
  const dotSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 10 }, (_, i) => {
        const isFilled = i < streak;
        const isCurrent = i === streak && streak < 10;

        let classes = `rounded-full ${dotSize} transition-all duration-300`;

        if (isFilled) {
          classes += " bg-amber-500 scale-110 shadow-md shadow-amber-400/50";
        } else if (isCurrent) {
          classes += " bg-amber-300 animate-pulse";
        } else {
          classes += " bg-gray-300";
        }

        return <div key={i} className={classes} />;
      })}
    </div>
  );
}
