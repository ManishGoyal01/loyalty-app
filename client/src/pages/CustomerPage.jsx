import React, { useState, useEffect, useCallback } from 'react';
import {
  registerCustomer,
  checkinCustomer,
  claimReward,
  getCustomer,
  getConfig,
} from '../api/api';

/* ── helpers ─────────────────────────────────────────── */

function todayIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

/* ── Streak Dots ─────────────────────────────────────── */

function StreakDots({ streak, total = 10 }) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
            i < streak
              ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-lg scale-110'
              : 'bg-white/30 text-white/60 border-2 border-white/40'
          }`}
        >
          {i < streak ? '🔥' : i + 1}
        </div>
      ))}
    </div>
  );
}

/* ── Countdown Timer ─────────────────────────────────── */

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function calc() {
      const now = new Date();
      const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      const midnight = new Date(ist);
      midnight.setUTCHours(24, 0, 0, 0);
      const diff = midnight - ist;
      if (diff <= 0) return '00:00:00';
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      return `${h}:${m}:${s}`;
    }
    calc();
    setTimeLeft(calc());
    const id = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-4 text-center">
      <p className="text-white/70 text-sm">Next check-in available in</p>
      <p className="text-white text-2xl font-mono font-bold tracking-widest mt-1">
        {timeLeft}
      </p>
    </div>
  );
}

/* ── Reward Claim Screen ─────────────────────────────── */

function RewardClaimScreen({ rewardIcon, rewardName, onClaim, claiming }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-bounce-in">
        <div className="text-7xl mb-4">{rewardIcon || '🎁'}</div>
        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">
          Congratulations! 🎉
        </h2>
        <p className="text-gray-500 mb-1">You completed a 10-day streak!</p>
        <p className="text-lg font-semibold text-orange-600 mb-6">
          {rewardIcon} {rewardName || 'Your Reward'}
        </p>
        <button
          onClick={onClaim}
          disabled={claiming}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50"
        >
          {claiming ? 'Claiming...' : 'Claim Reward 🎁'}
        </button>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────── */

export default function CustomerPage() {
  const [phone, setPhone] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [customer, setCustomer] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const [checkedInAnim, setCheckedInAnim] = useState(false);

  const alreadyToday =
    customer && customer.lastScan && customer.lastScan === todayIST();
  const isComplete = customer && customer.complete;

  /* load saved phone */
  useEffect(() => {
    const saved = localStorage.getItem('loyaltyPhone');
    if (saved) setPhone(saved);
    setLoading(false);
  }, []);

  /* fetch data whenever phone changes */
  const fetchData = useCallback(async () => {
    if (!phone) return;
    try {
      const [custRes, cfgRes] = await Promise.all([
        getCustomer(phone),
        getConfig(),
      ]);
      setCustomer(custRes.data);
      setConfig(cfgRes.data);
    } catch (err) {
      console.error(err);
      // If customer not found, clear local state
      if (err.response && err.response.status === 404) {
        localStorage.removeItem('loyaltyPhone');
        setPhone('');
      }
    }
  }, [phone]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* register */
  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(phoneInput)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    setRegistering(true);
    try {
      await registerCustomer(phoneInput);
      localStorage.setItem('loyaltyPhone', phoneInput);
      setPhone(phoneInput);
    } catch (err) {
      setError(
        err.response?.data?.error || 'Registration failed. Please try again.'
      );
    } finally {
      setRegistering(false);
    }
  }

  /* check in */
  async function handleCheckin() {
    setCheckingIn(true);
    try {
      const res = await checkinCustomer(phone);
      setCustomer(res.data);
      setCheckedInAnim(true);
      setTimeout(() => setCheckedInAnim(false), 1500);
    } catch (err) {
      if (err.response?.data?.alreadyToday) {
        // refresh to get latest state
        await fetchData();
      } else {
        setError(err.response?.data?.error || 'Check-in failed.');
      }
    } finally {
      setCheckingIn(false);
    }
  }

  /* claim */
  async function handleClaim() {
    setClaiming(true);
    try {
      await claimReward(phone);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Claim failed.');
    } finally {
      setClaiming(false);
    }
  }

  /* loading state */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-300 flex items-center justify-center">
        <div className="text-white text-xl font-semibold animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  /* ── Onboarding ────────────────────────────────────── */
  if (!phone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-300 flex items-center justify-center px-4">
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/30">
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">☕</div>
            <h1 className="text-3xl font-extrabold text-white drop-shadow">
              Welcome!
            </h1>
            <p className="text-white/80 mt-2 text-lg">
              Join our loyalty program and earn rewards with daily streaks!
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-white/90 text-sm font-medium mb-1">
                📱 Your Phone Number
              </label>
              <input
                type="tel"
                maxLength={10}
                value={phoneInput}
                onChange={(e) =>
                  setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                placeholder="Enter 10-digit number"
                className="w-full px-4 py-3 rounded-xl bg-white/90 text-gray-800 text-lg placeholder-gray-400 outline-none focus:ring-4 focus:ring-white/50 transition"
              />
            </div>

            {error && (
              <p className="text-red-100 bg-red-500/40 rounded-lg px-3 py-2 text-sm text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={registering}
              className="w-full py-3 rounded-xl bg-white text-orange-600 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition disabled:opacity-50"
            >
              {registering ? 'Registering...' : 'Join Now 🚀'}
            </button>
          </form>

          <p className="text-white/50 text-xs text-center mt-6">
            Visit daily to build your streak and unlock rewards!
          </p>
        </div>
      </div>
    );
  }

  /* ── Main Streak View ──────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-300 flex items-center justify-center px-4 py-8">
      {/* Reward Claim Overlay */}
      {isComplete && (
        <RewardClaimScreen
          rewardIcon={config?.rewardIcon}
          rewardName={config?.rewardName}
          onClaim={handleClaim}
          claiming={claiming}
        />
      )}

      <div className="max-w-md w-full space-y-6">
        {/* Greeting Card */}
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/30 text-center">
          <p className="text-white/80 text-sm">Welcome back 👋</p>
          <p className="text-white font-bold text-lg mt-1">
            📱 {phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
          </p>
        </div>

        {/* Streak Card */}
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/30">
          <div className="text-center mb-6">
            <p className="text-white/80 text-sm uppercase tracking-wider font-medium">
              Your Streak
            </p>
            <div
              className={`text-7xl font-extrabold text-white drop-shadow-lg mt-2 transition-transform duration-300 ${
                checkedInAnim ? 'scale-125' : ''
              }`}
            >
              {customer?.streak ?? 0}
              <span className="text-3xl text-white/70">/10</span>
            </div>
            {customer?.streak > 0 && (
              <p className="text-white/70 text-sm mt-1">
                {10 - (customer?.streak || 0)} more to go! 💪
              </p>
            )}
          </div>

          {/* Streak Dots */}
          <StreakDots streak={customer?.streak ?? 0} />

          {/* Reward Info */}
          {config && (
            <div className="mt-6 bg-white/20 rounded-xl px-4 py-3 flex items-center justify-center gap-2">
              <span className="text-2xl">{config.rewardIcon || '🎁'}</span>
              <span className="text-white font-semibold">
                {config.rewardName || 'Reward'}
              </span>
              <span className="text-white/60 text-sm ml-1">
                at 10 streak!
              </span>
            </div>
          )}

          {/* Check-in Button */}
          <div className="mt-6">
            {alreadyToday && !isComplete ? (
              <>
                <button
                  disabled
                  className="w-full py-4 rounded-xl bg-white/30 text-white font-bold text-lg cursor-not-allowed"
                >
                  Already checked in! ✅
                </button>
                <CountdownTimer />
              </>
            ) : !isComplete ? (
              <button
                onClick={handleCheckin}
                disabled={checkingIn}
                className="w-full py-4 rounded-xl bg-white text-orange-600 font-extrabold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition disabled:opacity-50"
              >
                {checkingIn ? (
                  <span className="animate-pulse">Checking in...</span>
                ) : (
                  'Check In Today 🔥'
                )}
              </button>
            ) : null}
          </div>

          {error && (
            <p className="mt-4 text-red-100 bg-red-500/40 rounded-lg px-3 py-2 text-sm text-center">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-white/40 text-xs text-center">
          Visit every day to keep your streak alive!
        </p>
      </div>
    </div>
  );
}
