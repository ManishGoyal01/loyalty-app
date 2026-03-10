import React from "react";

export default function RewardClaimScreen({ rewardIcon, rewardName, onClaim }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 px-6">
      {/* Sparkle decorations */}
      <div className="absolute top-10 left-8 text-4xl animate-bounce">✨</div>
      <div className="absolute top-20 right-10 text-3xl animate-ping">🌟</div>
      <div className="absolute bottom-32 left-12 text-3xl animate-bounce delay-150">
        ✨
      </div>
      <div className="absolute bottom-24 right-8 text-4xl animate-ping delay-300">
        🌟
      </div>

      {/* Trophy */}
      <div className="text-7xl mb-4 animate-bounce">🏆</div>

      {/* Heading */}
      <h1 className="text-4xl font-extrabold text-white mb-2 text-center">
        Congratulations!
      </h1>

      {/* Subtext */}
      <p className="text-lg text-white/90 mb-8 text-center">
        You've completed 10 check-ins!
      </p>

      {/* Reward display */}
      <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-6 flex flex-col items-center mb-8 shadow-lg">
        <span className="text-6xl mb-3">{rewardIcon}</span>
        <p className="text-2xl font-bold text-white">{rewardName}</p>
      </div>

      {/* Instruction */}
      <p className="text-white/80 text-base mb-8 text-center italic">
        Show this screen to the shopkeeper to claim your reward
      </p>

      {/* Claim button */}
      <button
        onClick={onClaim}
        className="bg-white text-orange-600 font-bold text-lg px-10 py-4 rounded-full shadow-xl hover:bg-orange-50 active:scale-95 transition-all duration-200"
      >
        Mark as Claimed
      </button>
    </div>
  );
}
