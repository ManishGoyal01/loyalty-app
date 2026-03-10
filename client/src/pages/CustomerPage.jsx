import { useState, useEffect, useCallback } from 'react';
import {
  registerCustomer,
  checkinCustomer,
  claimReward,
  getCustomer,
  getConfig,
} from '../api/api';

function todayIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

/* ── Get GPS position as a promise ────────────────────── */

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === 1) reject(new Error('Location permission denied. Please allow location access and try again.'));
        else if (err.code === 2) reject(new Error('Location unavailable. Please try again.'));
        else if (err.code === 3) reject(new Error('Location request timed out. Please try again.'));
        else reject(new Error('Could not get your location.'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/* ── Streak Ring ──────────────────────────────────────── */

function StreakRing({ streak, total = 10 }) {
  const radius = 90;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (streak / total) * circumference;

  return (
    <div className="relative w-56 h-56 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx="100" cy="100" r={radius} fill="none" stroke="url(#gradient)" strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference - progress} className="transition-all duration-1000 ease-out" />
        {Array.from({ length: total }).map((_, i) => {
          const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
          const cx = 100 + radius * Math.cos(angle);
          const cy = 100 + radius * Math.sin(angle);
          return (
            <circle key={i} cx={cx} cy={cy} r={i < streak ? 5 : 3}
              fill={i < streak ? '#f59e0b' : 'rgba(255,255,255,0.15)'}
              className={`transition-all duration-500 ${i < streak ? 'drop-shadow-lg' : ''}`}
              style={{ transitionDelay: `${i * 50}ms` }} />
          );
        })}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black text-white tabular-nums">{streak}</span>
        <span className="text-sm text-white/40 font-medium tracking-wider uppercase">of {total} days</span>
      </div>
    </div>
  );
}

/* ── Day Dots ─────────────────────────────────────────── */

function DayDots({ streak, total = 10 }) {
  return (
    <div className="flex items-center justify-center gap-2 stagger-children">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i}
          className={`rounded-full transition-all duration-500 animate-scale-in ${
            i < streak ? 'w-3 h-3 bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30'
              : i === streak ? 'w-3 h-3 bg-white/20 ring-2 ring-amber-400/50 animate-glow-pulse'
              : 'w-2.5 h-2.5 bg-white/10'
          }`}
          style={{ animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
}

/* ── Countdown Timer ──────────────────────────────────── */

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
    setTimeLeft(calc());
    const id = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-5 text-center">
      <p className="text-white/30 text-xs uppercase tracking-widest font-medium mb-1">Next check-in</p>
      <div className="inline-flex items-center gap-3 glass rounded-2xl px-6 py-3">
        {timeLeft.split(':').map((unit, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-mono font-bold text-white tabular-nums">{unit}</span>
              <span className="text-[10px] text-white/30 uppercase">{['hrs', 'min', 'sec'][idx]}</span>
            </div>
            {idx < 2 && <span className="text-white/20 text-lg font-light mb-3">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Reward Claim Screen ──────────────────────────────── */

function RewardClaimScreen({ rewardIcon, rewardName, onClaim, claiming }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/90 backdrop-blur-xl px-6">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-[120px]" />
      <div className="relative animate-scale-in max-w-sm w-full">
        <div className="glass rounded-3xl p-8 text-center">
          <div className="text-7xl mb-4 animate-float">{rewardIcon || '🎁'}</div>
          <h2 className="text-2xl font-extrabold text-white mb-1">Streak Complete!</h2>
          <p className="text-white/40 text-sm mb-6">You nailed 10 days in a row</p>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-5 py-2.5 mb-6">
            <span className="text-xl">{rewardIcon}</span>
            <span className="text-amber-300 font-semibold text-sm">{rewardName}</span>
          </div>
          <p className="text-white/30 text-xs mb-6 italic">Show this screen to the shopkeeper</p>
          <button onClick={onClaim} disabled={claiming}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-base shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.97] transition-all duration-200 disabled:opacity-50">
            {claiming ? 'Claiming...' : 'Mark as Claimed'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────── */

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

  const alreadyToday = customer?.lastScan === todayIST();
  const isComplete = customer?.complete;

  useEffect(() => {
    const saved = localStorage.getItem('loyaltyPhone');
    if (saved) setPhone(saved);
    setLoading(false);
  }, []);

  const fetchData = useCallback(async () => {
    if (!phone) return;
    try {
      const [custRes, cfgRes] = await Promise.all([getCustomer(phone), getConfig()]);
      setCustomer(custRes.data);
      setConfig(cfgRes.data);
    } catch (err) {
      if (err.response?.status === 404) {
        localStorage.removeItem('loyaltyPhone');
        setPhone('');
      }
    }
  }, [phone]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(phoneInput)) { setError('Enter a valid 10-digit phone number'); return; }
    setRegistering(true);
    try {
      await registerCustomer(phoneInput);
      localStorage.setItem('loyaltyPhone', phoneInput);
      setPhone(phoneInput);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setRegistering(false); }
  }

  async function handleCheckin() {
    setCheckingIn(true);
    setError('');
    try {
      // Get GPS location
      const { lat, lng } = await getLocation();
      // Send check-in with location
      const res = await checkinCustomer(phone, lat, lng);
      setCustomer(res.data);
      if (!res.data.alreadyToday) {
        setCheckedInAnim(true);
        setTimeout(() => setCheckedInAnim(false), 3000);
      }
    } catch (err) {
      // err could be from getLocation() or from API
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(err.message || 'Check-in failed');
      }
    } finally { setCheckingIn(false); }
  }

  async function handleClaim() {
    setClaiming(true);
    try { await claimReward(phone); await fetchData(); }
    catch (err) { setError(err.response?.data?.error || 'Claim failed'); }
    finally { setClaiming(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Onboarding ─────────────────────────────────────── */
  if (!phone) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center px-5 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="relative glass rounded-3xl p-8 max-w-sm w-full animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
              <span className="text-3xl">🏪</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome</h1>
            <p className="text-white/40 mt-2 text-sm leading-relaxed">
              Join our loyalty program. Visit daily,<br />earn rewards after 10-day streaks.
            </p>
          </div>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">Phone Number</label>
              <input type="tel" maxLength={10} value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit number"
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-base placeholder-white/20 outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all duration-300" />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}
            <button type="submit" disabled={registering}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-base shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 active:scale-[0.97] transition-all duration-200 disabled:opacity-50">
              {registering ? 'Joining...' : 'Get Started'}
            </button>
          </form>
          <p className="text-white/20 text-[11px] text-center mt-6">
            Visit the shop daily to build your streak
          </p>
        </div>
      </div>
    );
  }

  /* ── Main Streak View ───────────────────────────────── */
  return (
    <div className="min-h-screen bg-surface-900 flex flex-col items-center px-5 py-8 relative overflow-hidden">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-amber-500/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-purple-500/5 rounded-full blur-[80px]" />

      {isComplete && (
        <RewardClaimScreen rewardIcon={config?.rewardIcon} rewardName={config?.rewardName}
          onClaim={handleClaim} claiming={claiming} />
      )}

      <div className="relative max-w-sm w-full space-y-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/30 text-xs uppercase tracking-widest font-medium">Welcome back</p>
            <p className="text-white/70 text-sm font-mono mt-0.5">
              {phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
            <span className="text-base">👤</span>
          </div>
        </div>

        {/* Streak Ring Card */}
        <div className="glass rounded-3xl p-6 pt-8">
          <div className={`transition-transform duration-500 ${checkedInAnim ? 'scale-105' : ''}`}>
            <StreakRing streak={customer?.streak ?? 0} />
          </div>
          <div className="mt-4">
            <DayDots streak={customer?.streak ?? 0} />
          </div>
          {customer?.streak > 0 && customer?.streak < 10 && (
            <p className="text-center text-white/25 text-xs mt-4">
              {10 - (customer?.streak || 0)} day{10 - (customer?.streak || 0) !== 1 ? 's' : ''} to go
            </p>
          )}
        </div>

        {/* Reward Strip */}
        {config && (
          <div className="glass rounded-2xl px-5 py-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">{config.rewardIcon || '🎁'}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white/70 text-sm font-medium truncate">{config.rewardName || 'Reward'}</p>
              <p className="text-white/25 text-xs">Complete 10-day streak to unlock</p>
            </div>
          </div>
        )}

        {/* Check-in Button / Status */}
        <div>
          {alreadyToday && !isComplete ? (
            <div className="space-y-1">
              <div className="w-full py-4 rounded-2xl glass border border-emerald-500/20 text-center">
                <span className="inline-flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Checked in today
                </span>
              </div>
              <CountdownTimer />
              <p className="text-white/20 text-[11px] text-center mt-2">
                Come back tomorrow to continue your streak
              </p>
            </div>
          ) : !isComplete ? (
            <button
              onClick={handleCheckin}
              disabled={checkingIn}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-base shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:brightness-110 active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
            >
              {checkingIn ? (
                <span className="inline-flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying location...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  Check In at Shop
                </span>
              )}
            </button>
          ) : null}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
