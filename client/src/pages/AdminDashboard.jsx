import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminStats, getAdminCustomers, updateReward } from '../api/api';

function todayIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

/* ── Status Badge ─────────────────────────────────────── */

function StatusBadge({ customer }) {
  const today = todayIST();
  let label, color;

  if (customer.complete) {
    label = 'Complete'; color = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (customer.lastScan === today) {
    label = 'Active'; color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (customer.lastScan) {
    label = 'Broken'; color = 'bg-red-500/10 text-red-400 border-red-500/20';
  } else {
    label = 'New'; color = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${color}`}>
      {label}
    </span>
  );
}

/* ── Mini Progress Bar ────────────────────────────────── */

function MiniProgress({ streak, total = 10 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < streak
              ? 'w-2.5 bg-gradient-to-r from-amber-400 to-orange-500'
              : 'w-1.5 bg-white/10'
          }`}
        />
      ))}
    </div>
  );
}

/* ── Stat Card ────────────────────────────────────────── */

function StatCard({ label, value, color, icon }) {
  return (
    <div className="glass rounded-2xl p-5 group hover:bg-white/[0.07] transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/30 text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-white mt-2 tabular-nums">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ── Main Dashboard ───────────────────────────────────── */

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [token] = useState(() => localStorage.getItem('adminToken'));
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [rewardIcon, setRewardIcon] = useState('');
  const [rewardName, setRewardName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!token) navigate('/admin', { replace: true }); }, [token, navigate]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, custRes] = await Promise.all([
        getAdminStats(token),
        getAdminCustomers(token),
      ]);
      setStats(statsRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin', { replace: true });
      }
    } finally { setLoading(false); }
  }, [token, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSaveReward(e) {
    e.preventDefault();
    if (!rewardIcon.trim() || !rewardName.trim()) return;
    setSaving(true); setSaveMsg('');
    try {
      await updateReward(token, rewardIcon.trim(), rewardName.trim());
      setSaveMsg('saved');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch { setSaveMsg('error'); }
    finally { setSaving(false); }
  }

  function handleLogout() {
    localStorage.removeItem('adminToken');
    navigate('/admin', { replace: true });
  }

  const filtered = customers.filter((c) => c.phone.includes(search.replace(/\D/g, '')));
  const frontendUrl = window.location.origin;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(frontendUrl)}`;

  if (!token) return null;

  return (
    <div className="min-h-screen bg-surface-900">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <h1 className="text-base font-semibold text-white">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
              title="Refresh"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white/50 text-xs font-medium hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/10 transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8 space-y-6">
        {loading && !stats ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Customers"
                value={stats?.totalCustomers ?? 0}
                color="bg-blue-500/10"
                icon={<svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
              />
              <StatCard
                label="Active Today"
                value={stats?.activeToday ?? 0}
                color="bg-emerald-500/10"
                icon={<svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /></svg>}
              />
              <StatCard
                label="Rewards Claimed"
                value={stats?.totalClaimed ?? 0}
                color="bg-amber-500/10"
                icon={<svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0" /></svg>}
              />
            </div>

            {/* Reward Config + QR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Change Reward */}
              <div className="glass rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Reward Settings
                </h2>
                <form onSubmit={handleSaveReward} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={rewardIcon}
                    onChange={(e) => setRewardIcon(e.target.value)}
                    placeholder="🎁"
                    className="w-16 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-center text-xl text-white outline-none focus:border-amber-500/40 transition-all"
                  />
                  <input
                    type="text"
                    value={rewardName}
                    onChange={(e) => setRewardName(e.target.value)}
                    placeholder="Reward name..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 outline-none focus:border-amber-500/40 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-all disabled:opacity-50 whitespace-nowrap"
                  >
                    {saving ? 'Saving...' : 'Update'}
                  </button>
                </form>
                {saveMsg && (
                  <p className={`mt-3 text-xs font-medium ${saveMsg === 'saved' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {saveMsg === 'saved' ? 'Reward updated successfully' : 'Failed to update'}
                  </p>
                )}
              </div>

              {/* QR Code */}
              <div className="glass rounded-2xl p-6 flex items-center gap-6">
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="w-28 h-28 rounded-xl border border-white/10"
                />
                <div>
                  <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Customer QR Code
                  </h2>
                  <p className="text-white/30 text-xs leading-relaxed">
                    Print and place at your counter. Customers scan to check in daily.
                  </p>
                  <p className="text-emerald-400/60 text-[10px] mt-2 font-medium">
                    Permanent QR — paint it or print it
                  </p>
                  <p className="text-white/15 text-[10px] mt-1 font-mono break-all">{frontendUrl}</p>
                </div>
              </div>
            </div>

            {/* Customer Table */}
            <div className="glass rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Customers
                  <span className="text-white/20 font-normal ml-1">({customers.length})</span>
                </h2>
                <div className="relative w-full sm:w-64">
                  <svg className="w-4 h-4 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by phone..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs placeholder-white/20 outline-none focus:border-white/15 transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="pb-3 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wider">Phone</th>
                      <th className="pb-3 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wider">Streak</th>
                      <th className="pb-3 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wider hidden sm:table-cell">Progress</th>
                      <th className="pb-3 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wider hidden md:table-cell">Last Scan</th>
                      <th className="pb-3 text-right text-[10px] font-semibold text-white/25 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-white/20 text-sm">
                          No customers found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((c) => (
                        <tr key={c.phone} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 text-sm font-mono text-white/70">{c.phone}</td>
                          <td className="py-3.5 text-sm font-semibold text-white/60">
                            <span className="text-white">{c.streak}</span>
                            <span className="text-white/20">/10</span>
                          </td>
                          <td className="py-3.5 hidden sm:table-cell">
                            <MiniProgress streak={c.streak} />
                          </td>
                          <td className="py-3.5 text-xs text-white/30 hidden md:table-cell font-mono">
                            {c.lastScan || '—'}
                          </td>
                          <td className="py-3.5 text-right">
                            <StatusBadge customer={c} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
