import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { Clock, Users, Scissors, AlertCircle, ArrowLeft, XCircle, CheckCircle2, Bell, Sparkles, RefreshCw } from 'lucide-react';
import { api, setSavedQueueId } from '../api';

export default function QueueStatus({ t }) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [hasAlertedCalled, setHasAlertedCalled] = useState(false);
  const audioRef = useRef(null);

  const fetchStatus = async () => {
    try {
      const res = await api.getStatus(id);
      setData(res);
      setError(null);
      setSavedQueueId(id);

      // Trigger call buzzer/vibration once when status changes to called
      if (res.status === 'called' && !hasAlertedCalled) {
        setHasAlertedCalled(true);
        if ('vibrate' in navigator) {
          try { navigator.vibrate([200, 100, 200]); } catch (_) {}
        }
        playBuzzerTone();
      }
    } catch (err) {
      if (err.status === 404) {
        setError('This queue spot could not be found.');
      } else {
        setError(err.message || 'Unable to fetch status.');
      }
    } finally {
      setLoading(false);
    }
  };

  const playBuzzerTone = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 chime
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5 chime
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (_) {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [id, hasAlertedCalled]);

  const handleCancelSpot = async () => {
    setCancelling(true);
    try {
      await api.cancelStatus(id);
      setShowCancelModal(false);
      setSavedQueueId('');
      fetchStatus();
    } catch (err) {
      alert(err.message || 'Failed to cancel spot');
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Retrieving your token details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-heading font-bold text-slate-900">Queue Entry Not Found</h2>
        <p className="text-xs text-slate-600">{error}</p>
        <Link
          to="/join"
          className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          <span>Join the Queue</span>
        </Link>
      </div>
    );
  }

  const isCalled = data.status === 'called';
  const isInChair = data.status === 'in_chair';
  const isDone = data.status === 'done';
  const isCancelled = data.status === 'cancelled';
  const isNoShow = data.status === 'no_show';
  const isWaiting = data.status === 'waiting';

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back Link & Brand */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          {t.lastUpdated}
        </span>
      </div>

      {/* FULL-SCREEN / HIGHLIGHT ALERT WHEN CALLED */}
      {isCalled && (
        <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl border-2 border-amber-400 animate-gentle-pulse space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-400/20">
            <Bell className="w-7 h-7 animate-bounce" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
              {t.itsYourTurn}
            </span>
            <h2 className="text-4xl sm:text-5xl font-heading font-extrabold text-white">
              Token #{data.token}
            </h2>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 max-w-sm mx-auto">
            <p className="text-xs text-slate-300 mb-1">{t.pleaseProceedTo}</p>
            <p className="text-xl font-heading font-bold text-amber-300">
              {data.assignedBarberName || data.assignedBarber}
            </p>
          </div>

          <p className="text-xs text-slate-300">
            Please walk in and take your seat. Your stylist is waiting for you!
          </p>
        </div>
      )}

      {/* IN CHAIR STATE */}
      {isInChair && (
        <div className="rounded-3xl bg-emerald-900 p-6 text-white text-center space-y-3 border border-emerald-700 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto">
            <Scissors className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-heading font-bold">{t.serviceStarted}</h2>
          <p className="text-xs text-emerald-200">
            Stylist: <strong className="text-white">{data.assignedBarberName}</strong>
          </p>
        </div>
      )}

      {/* COMPLETED STATE */}
      {isDone && (
        <div className="rounded-3xl bg-white p-6 sm:p-8 text-center space-y-3 border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-slate-900">{t.serviceFinished}</h2>
          <p className="text-xs text-slate-500">We hope you loved your grooming session.</p>
          <Link
            to="/join"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 pt-2"
          >
            <span>Book another spot</span>
          </Link>
        </div>
      )}

      {/* CANCELLED / NO-SHOW STATES */}
      {(isCancelled || isNoShow) && (
        <div className="rounded-3xl bg-slate-100 p-6 sm:p-8 text-center space-y-3 border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-heading font-bold text-slate-900">
            {isCancelled ? t.spotCancelled : t.markedNoShow}
          </h2>
          <p className="text-xs text-slate-500">
            Need styling? You are welcome to join the queue anytime.
          </p>
          <Link
            to="/join"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <span>Join Queue Again</span>
          </Link>
        </div>
      )}

      {/* WAITING STATE CARD (MAIN EXPERIENCE) */}
      {isWaiting && (
        <>
          {/* Progression Alert Pill */}
          {data.position === 1 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2 shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{t.youAreNext}</span>
            </div>
          )}
          {data.position === 2 && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t.startComing}</span>
            </div>
          )}

          {/* Core Token Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.tokenNumber}
              </span>
              <div className="text-6xl sm:text-7xl font-heading font-extrabold text-slate-900 tracking-tight">
                #{data.token}
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {data.customerName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100">
              {/* Position */}
              <div className="text-center space-y-1">
                <span className="text-xs text-slate-500 block">{t.yourPosition}</span>
                <strong className="text-3xl font-heading font-bold text-emerald-700">
                  {data.position != null ? `#${data.position}` : '—'}
                </strong>
                <span className="text-[11px] text-slate-400 block">in line</span>
              </div>

              {/* Estimated Wait */}
              <div className="text-center space-y-1">
                <span className="text-xs text-slate-500 block">{t.estimatedWaitTime}</span>
                <strong className="text-3xl font-heading font-bold text-slate-900">
                  {data.estimatedWaitMinutes != null
                    ? `${data.estimatedWaitMinutes}m`
                    : 'Approx.'}
                </strong>
                <span className="text-[11px] text-slate-400 block">
                  {data.estimatedWaitMinutes != null
                    ? `${t.aboutMinutes} ${data.estimatedWaitMinutes} ${t.minutes}`
                    : 'Wait estimate unavailable'}
                </span>
              </div>
            </div>

            {/* Booking Details Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">{t.services}:</span>
                <span className="font-semibold text-slate-900 text-right">{data.serviceNames}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.preference}:</span>
                <span className="font-semibold text-slate-900">
                  {data.barberPreference ? data.barberPreference : t.anyBarber}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-2">
                <span className="text-slate-500">{t.totalPrice}:</span>
                <strong className="font-bold text-emerald-800 text-sm">₹{data.totalPrice}</strong>
              </div>
            </div>

            {/* Cancel Spot Button */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-all"
              >
                {t.cancelSpot}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-heading font-bold text-slate-900">
              {t.cancelSpot}
            </h3>
            <p className="text-xs text-slate-600">
              {t.cancelConfirm}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {t.keepSpot}
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelSpot}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                {cancelling ? 'Cancelling...' : t.yesCancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
