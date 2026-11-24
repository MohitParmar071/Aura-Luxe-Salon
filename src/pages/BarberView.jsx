import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Scissors, Clock, CheckCircle2, Coffee, AlertCircle, Play, Check, User, ArrowRight } from 'lucide-react';
import { api } from '../api';

export default function BarberView({ t, staffUser }) {
  const { name: paramSlug } = useParams();
  const navigate = useNavigate();
  // Default to staff user's own barber slug if no slug in url
  const slug = paramSlug || staffUser?.barberSlug || 'arjun';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBarber = async () => {
    try {
      const res = await api.getBarberView(slug);
      setData(res);
      setError(null);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        navigate(`/login?redirect=/barber/${slug}`);
      } else {
        setError(err.message || 'Unable to load stylist view');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarber();
    const interval = setInterval(fetchBarber, 3000);
    return () => clearInterval(interval);
  }, [slug]);

  const handleToggleBreak = async () => {
    if (!data?.barber) return;
    const nextBreak = !data.barber.onBreak;
    try {
      await api.setBarberBreak(slug, nextBreak);
      fetchBarber();
    } catch (err) {
      alert(err.message || 'Failed to update break status');
    }
  };

  const handleEntryAction = async (token, action) => {
    setActionLoading(true);
    try {
      await api.barberEntryAction(slug, token, action);
      fetchBarber();
    } catch (err) {
      alert(err.message || `Failed to perform ${action}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const barber = data?.barber || {};
  const current = data?.currentCustomer;
  const next = data?.nextCustomer;
  const isCalled = current?.status === 'called';
  const isInChair = current?.status === 'in_chair';

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Header with Break Switch */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t.barberTitle}
          </span>
          <h1 className="text-2xl font-heading font-extrabold text-slate-900">
            {barber.name}
          </h1>
          <p className="text-xs text-slate-500">
            {barber.onBreak ? 'Currently on break' : 'Active and accepting clients'}
          </p>
        </div>

        {/* Break Toggle Button */}
        <button
          type="button"
          onClick={handleToggleBreak}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
            barber.onBreak
              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>{barber.onBreak ? t.resumeWork : t.takeBreak}</span>
        </button>
      </div>

      {/* Break Warning if On Break */}
      {barber.onBreak && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
          <Coffee className="w-5 h-5 text-amber-600 shrink-0" />
          <span>You are marked on break. Reception cannot call new customers to your chair until you resume duty.</span>
        </div>
      )}

      {/* Main Active Customer Card */}
      {current ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/80 shadow-md space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {isInChair ? t.inChair : t.called}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Elapsed: {current.elapsedMinutes}m
            </span>
          </div>

          <div className="text-center space-y-1">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Assigned Token
            </span>
            <div className="text-5xl sm:text-6xl font-heading font-extrabold text-slate-950">
              #{current.token}
            </div>
            <h2 className="text-xl font-heading font-bold text-slate-800 pt-1">
              {current.customerName}
            </h2>
          </div>

          {/* Service Details */}
          <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Requested Services:</span>
              <strong className="text-slate-900 font-semibold">{current.serviceNames}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Estimated Duration:</span>
              <span className="text-slate-900 font-medium">{current.durationMinutes} min</span>
            </div>
            <div className="flex justify-between border-t border-slate-200/60 pt-2">
              <span className="text-slate-500">Total Bill:</span>
              <strong className="text-emerald-700 font-bold text-sm">₹{current.totalPrice}</strong>
            </div>
          </div>

          {/* LARGE PRIMARY ACTION BUTTON */}
          <div>
            {isCalled && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleEntryAction(current.token, 'start')}
                className="w-full py-4 rounded-2xl text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>{actionLoading ? 'Starting...' : t.startService}</span>
              </button>
            )}

            {isInChair && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleEntryAction(current.token, 'done')}
                className="w-full py-4 rounded-2xl text-base font-bold bg-slate-950 hover:bg-emerald-950 text-white shadow-lg shadow-slate-950/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
              >
                <Check className="w-5 h-5 stroke-[3] text-amber-400" />
                <span>{actionLoading ? 'Finishing...' : t.finishService}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Empty / Idle State */
        <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-200/90 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Scissors className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-heading font-bold text-slate-900">
            {t.noCurrentCustomer}
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Your chair is currently clear. Reception will assign the next customer shortly.
          </p>
        </div>
      )}

      {/* Next Customer in Line Preview */}
      {next && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>{t.nextCustomerPreview}</span>
            <span className="font-bold text-emerald-700">Token #{next.token}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-900">{next.customerName}</span>
            <span className="text-slate-500">{next.durationMinutes} min · {next.serviceNames}</span>
          </div>
        </div>
      )}
    </div>
  );
}
