import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Users, Clock, ArrowRight, Sparkles, CheckCircle2, Coffee, AlertCircle, ShieldCheck } from 'lucide-react';
import { api } from '../api';

export default function Home({ t }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHome = async () => {
    try {
      const res = await api.getHome();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHome();
    const interval = setInterval(fetchHome, 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Loading salon queue...</p>
        </div>
      </div>
    );
  }

  const hours = data?.hours || {};
  const isOnlineOpen = hours.onlineAllowed;
  const waitingCount = data?.waitingCount || 0;
  const waitMin = data?.estimatedWaitMinutes;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{hours.isOpen ? `${t.openUntil} ${hours.closingTime}` : t.closed}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-heading font-extrabold text-slate-900 tracking-tight">
          {t.salonName}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
          {t.joinSubtitle}
        </p>
      </div>

      {/* Main Live Queue Status Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20 border border-emerald-800/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Waiting & Time Stats */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Queue Monitor</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-extrabold font-heading tracking-tight text-white">
                {waitingCount}
              </span>
              <span className="text-slate-300 text-sm font-medium">
                {waitingCount === 0 ? t.noOneWaiting : t.peopleWaiting}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-300 bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl w-fit border border-white/10">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {t.approxWait}: <strong className="text-white font-semibold">
                  {waitMin != null ? `${waitMin} ${t.minutes}` : 'Ready for you'}
                </strong> ({t.anyBarber})
              </span>
            </div>
          </div>

          {/* Join CTA Action Box */}
          <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex flex-col justify-center space-y-3">
            {isOnlineOpen ? (
              <>
                <Link
                  to="/join"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-bold text-slate-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-950/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span>{t.joinQueue}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <p className="text-xs text-center text-slate-400">
                  Select your service, choose stylist preference & get instant token
                </p>
              </>
            ) : (
              <div className="text-center py-2 space-y-2">
                <div className="inline-flex items-center gap-1.5 text-amber-300 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>{t.onlineJoiningClosed}</span>
                </div>
                <p className="text-xs text-slate-400">
                  {t.onlineJoiningClosedDesc}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stylists On Duty Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Stylists on Duty</span>
          </h2>
          <span className="text-xs text-slate-500">Live Status</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data?.barbers?.map((barber) => {
            const isServing = barber.state === 'serving';
            const isCalled = barber.state === 'called';
            const isOnBreak = barber.state === 'on_break';
            const isAvailable = barber.state === 'available';

            return (
              <div
                key={barber.slug}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-slate-900">
                    {barber.name}
                  </span>
                  <span className="text-xs">
                    {isServing && (
                      <span className="px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        {t.serving}
                      </span>
                    )}
                    {isCalled && (
                      <span className="px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-800 border border-purple-200">
                        {t.called}
                      </span>
                    )}
                    {isOnBreak && (
                      <span className="px-2 py-0.5 rounded-full font-medium bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <Coffee className="w-3 h-3" />
                        <span>{t.onBreak}</span>
                      </span>
                    )}
                    {isAvailable && (
                      <span className="px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{t.available}</span>
                      </span>
                    )}
                  </span>
                </div>

                <div className="text-xs text-slate-500">
                  {barber.currentToken ? (
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <span>Serving Token:</span>
                      <strong className="text-sm font-bold text-emerald-700">#{barber.currentToken}</strong>
                    </div>
                  ) : (
                    <span>{isOnBreak ? 'Temporarily away' : 'Ready for next client'}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Salon Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-100/60 text-slate-700">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="font-semibold text-slate-900 block mb-0.5">Zero Waiting Room Stress</strong>
            Arrive precisely when your turn is near with live phone updates.
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-100/60 text-slate-700">
          <Clock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="font-semibold text-slate-900 block mb-0.5">Live ETA Updates</strong>
            Smart queue algorithms calculate accurate wait times per stylist.
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-100/60 text-slate-700">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="font-semibold text-slate-900 block mb-0.5">Premium Grooming Experience</strong>
            Master barbers, luxury organic products & bespoke care.
          </div>
        </div>
      </div>
    </div>
  );
}
