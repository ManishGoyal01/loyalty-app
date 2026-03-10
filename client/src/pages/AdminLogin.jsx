import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../api/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [phoneInput, setPhoneInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /* redirect if already logged in */
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!/^\d{10}$/.test(phoneInput)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await adminLogin(phoneInput);
      localStorage.setItem('adminToken', res.data.token);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError('Unauthorized');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter your admin phone number
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              maxLength={10}
              value={phoneInput}
              onChange={(e) =>
                setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))
              }
              placeholder="Enter 10-digit number"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-800 text-lg placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
            />
          </div>

          {error && (
            <p className="text-red-600 bg-red-50 rounded-lg px-3 py-2 text-sm text-center font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gray-800 text-white font-bold text-lg hover:bg-gray-700 active:scale-95 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-gray-400 text-xs text-center mt-6">
          Only authorized administrators can access the dashboard.
        </p>
      </div>
    </div>
  );
}
