import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { Scissors, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { api, setAuthToken } from '../api';

export default function StaffLogin({ t, setStaffUser }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (loginEmail, loginPassword) => {
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({
        email: (loginEmail || email).trim().toLowerCase(),
        password: loginPassword || password,
      });

      if (res.token) {
        setAuthToken(res.token);
        setStaffUser(res.user);

        // Determine destination
        if (redirectPath) {
          navigate(redirectPath);
        } else if (res.user.role === 'owner') {
          navigate('/admin');
        } else if (res.user.role === 'receptionist') {
          navigate('/reception');
        } else if (res.user.role === 'barber') {
          navigate(`/barber/${res.user.barberSlug || 'arjun'}`);
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid email address or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    handleLogin(demoEmail, demoPassword);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16 space-y-8">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
          <Lock className="w-6 h-6 text-amber-400" />
        </div>
        <h1 className="text-2xl font-heading font-extrabold text-slate-900">
          Staff Portal Sign In
        </h1>
        <p className="text-xs text-slate-500">
          Sign in to manage reception, stylist chair or owner analytics.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Work Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. reception@auraluxe.in"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-emerald-900 text-white shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* 1-Click Demo Accounts Quick-Fill */}
      <div className="bg-slate-100/80 rounded-2xl p-5 border border-slate-200 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Demo Access (1-Click Test)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillDemo('owner@auraluxe.in', 'AuraOwner@2026')}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-colors shadow-2xs"
          >
            <strong className="text-xs font-bold text-slate-900 block">Owner</strong>
            <span className="text-[10px] text-slate-500 block truncate">owner@auraluxe.in</span>
          </button>

          <button
            type="button"
            onClick={() => fillDemo('reception@auraluxe.in', 'AuraRecep@2026')}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-colors shadow-2xs"
          >
            <strong className="text-xs font-bold text-slate-900 block">Reception</strong>
            <span className="text-[10px] text-slate-500 block truncate">reception@auraluxe.in</span>
          </button>

          <button
            type="button"
            onClick={() => fillDemo('arjun@auraluxe.in', 'BarberArjun@2026')}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-colors shadow-2xs"
          >
            <strong className="text-xs font-bold text-slate-900 block">Barber (Arjun)</strong>
            <span className="text-[10px] text-slate-500 block truncate">arjun@auraluxe.in</span>
          </button>
        </div>
      </div>
    </div>
  );
}
