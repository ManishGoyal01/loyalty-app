import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAdminStats,
  getAdminCustomers,
  updateReward,
} from '../api/api';

/* ── Helpers ─────────────────────────────────────────── */

function todayIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

function statusBadge(customer) {
  const today = todayIST();
  if (customer.complete) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
        Complete 🏆
      </span>
    );
  }
  if (customer.lastScan === today) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
        Active 🔥
      </span>
    );
  }
  if (customer.lastScan) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
        Broken 💔
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
      New 🌱
    </span>
  );
}

/* ── Mini Streak Dots ────────────────────────────────── */

function MiniStreakDots({ streak, total = 10 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${
            i < streak ? 'bg-orange-500' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

/* ── Stat Card ───────────────────────────────────────── */

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{label}</p>
          <p className="text-3xl font-extrabold text-gray-800 mt-1">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────── */

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

  /* guard */
  useEffect(() => {
    if (!token) {
      navigate('/admin', { replace: true });
    }
  }, [token, navigate]);

  /* fetch data */
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
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* save reward */
  async function handleSaveReward(e) {
    e.preventDefault();
    if (!rewardIcon.trim() || !rewardName.trim()) return;
    setSaving(true);
    setSaveMsg('');
    try {
      await updateReward(token, rewardIcon.trim(), rewardName.trim());
      setSaveMsg('Reward updated!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg('Failed to update.');
    } finally {
      setSaving(false);
    }
  }

  /* logout */
  function handleLogout() {
    localStorage.removeItem('adminToken');
    navigate('/admin', { replace: true });
  }

  /* filter customers */
  const filtered = customers.filter((c) =>
    c.phone.includes(search.replace(/\D/g, ''))
  );

  /* QR URL */
  const frontendUrl = window.location.origin;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    frontendUrl
  )}`;

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">
            📊 Admin Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition"
            >
              🔄 Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {loading && !stats ? (
          <p className="text-center text-gray-500 py-12 animate-pulse">
            Loading dashboard...
          </p>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Total Customers"
                value={stats?.totalCustomers ?? 0}
                icon="👥"
              />
              <StatCard
                label="Active Streaks Today"
                value={stats?.activeStreaksToday ?? 0}
                icon="🔥"
              />
              <StatCard
                label="Total Rewards Claimed"
                value={stats?.totalRewardsClaimed ?? 0}
                icon="🏆"
              />
            </div>

            {/* Change Reward + QR Code Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Change Reward */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  🎁 Change Reward
                </h2>
                <form
                  onSubmit={handleSaveReward}
                  className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
                >
                  <div className="flex-shrink-0">
                    <label className="block text-gray-600 text-xs font-medium mb-1">
                      Emoji
                    </label>
                    <input
                      type="text"
                      value={rewardIcon}
                      onChange={(e) => setRewardIcon(e.target.value)}
                      placeholder="🎁"
                      className="w-20 px-3 py-2 rounded-lg border border-gray-300 text-center text-2xl outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-gray-600 text-xs font-medium mb-1">
                      Reward Name
                    </label>
                    <input
                      type="text"
                      value={rewardName}
                      onChange={(e) => setRewardName(e.target.value)}
                      placeholder="Free Coffee"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-800 outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </form>
                {saveMsg && (
                  <p
                    className={`mt-3 text-sm font-medium ${
                      saveMsg.includes('updated')
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {saveMsg}
                  </p>
                )}
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center text-center">
                <h2 className="text-lg font-bold text-gray-800 mb-3">
                  📱 Customer QR Code
                </h2>
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="w-48 h-48 rounded-lg border border-gray-200"
                />
                <p className="text-gray-500 text-sm mt-3">
                  Print this QR and stick at counter
                </p>
                <p className="text-gray-400 text-xs mt-1 break-all">
                  {frontendUrl}
                </p>
              </div>
            </div>

            {/* Customer Table */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                  👥 Customers
                </h2>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by phone..."
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-400 w-full sm:w-64"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Streak
                      </th>
                      <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Last Scan
                      </th>
                      <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 text-center text-gray-400"
                        >
                          No customers found.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((c) => (
                        <tr key={c.phone} className="hover:bg-gray-50">
                          <td className="py-3 text-sm font-mono text-gray-800">
                            {c.phone}
                          </td>
                          <td className="py-3 text-sm font-semibold text-gray-800">
                            {c.streak}/10
                          </td>
                          <td className="py-3">
                            <MiniStreakDots streak={c.streak} />
                          </td>
                          <td className="py-3 text-sm text-gray-600">
                            {c.lastScan || '—'}
                          </td>
                          <td className="py-3">{statusBadge(c)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <p className="text-gray-400 text-xs mt-4">
                Showing {filtered.length} of {customers.length} customers
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
