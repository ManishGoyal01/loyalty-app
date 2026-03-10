import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../api/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [phoneInput, setPhoneInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('adminToken')) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(phoneInput)) { setError('Enter a valid 10-digit phone number'); return; }
    setLoading(true);
    try {
      const res = await adminLogin(phoneInput);
      localStorage.setItem('adminToken', res.data.token);
      navigate('/admin/dashboard', { replace: true });
    } catch { setError('Unauthorized phone number'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[120px]" />

      <div className="relative glass rounded-3xl p-8 max-w-sm w-full animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Admin Access</h1>
          <p className="text-white/30 text-sm mt-1">Enter your authorized phone number</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/40 text-xs font-medium mb-2 uppercase tracking-wider">
              Phone Number
            </label>
            <input
              type="tel"
              maxLength={10}
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit number"
              className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-base placeholder-white/20 outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all duration-300"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-base shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="text-white/15 text-[11px] text-center mt-6">
          Only whitelisted phone numbers can access this panel
        </p>
      </div>
    </div>
  );
}
