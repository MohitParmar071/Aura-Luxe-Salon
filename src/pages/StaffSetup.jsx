import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../api';

export default function StaffSetup({ t }) {
  const { token } = useParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function checkToken() {
      try {
        const res = await api.getInvitation(token);
        setInvitation(res);
      } catch (err) {
        setError(err.message || 'This setup link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    }
    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await api.completeSetup({ token, password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      alert(err.message || 'Failed to setup password');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-heading font-bold text-slate-900">Invalid or Expired Link</h2>
        <p className="text-xs text-slate-600">{error}</p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800"
        >
          <span>Go to Staff Sign In</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
          <Lock className="w-6 h-6 text-amber-400" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">
          Set Up Staff Account
        </h1>
        <p className="text-xs text-slate-500">
          Welcome {invitation.displayName} ({invitation.email})! Create your password below.
        </p>
      </div>

      {success ? (
        <div className="bg-emerald-50 rounded-2xl p-6 text-center space-y-2 border border-emerald-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="font-heading font-bold text-emerald-950 text-base">Account Activated!</h3>
          <p className="text-xs text-emerald-800">
            Redirecting you to the staff sign-in page...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password (minimum 6 characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-emerald-900 text-white shadow-md transition-colors"
          >
            {submitting ? 'Setting Password...' : 'Save Password & Sign In'}
          </button>
        </form>
      )}
    </div>
  );
}
