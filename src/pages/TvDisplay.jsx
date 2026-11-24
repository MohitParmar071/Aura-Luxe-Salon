import React, { useState, useEffect, useRef } from 'react';
import { Scissors, Volume2, VolumeX, Sparkles, Clock } from 'lucide-react';
import { api } from '../api';

export default function TvDisplay({ t }) {
  const [data, setData] = useState(null);
  const [buzzerEnabled, setBuzzerEnabled] = useState(false);
  const previousTokensRef = useRef(new Set());

  const fetchDisplay = async () => {
    try {
      const res = await api.getTvDisplay();
      setData(res);

      // Check if a new token was called
      const currentActiveTokens = new Set(
        res.barbers
          ?.map(b => b.currentToken)
          ?.filter(Boolean) || []
      );

      let hasNewCall = false;
      for (const tok of currentActiveTokens) {
        if (!previousTokensRef.current.has(tok)) {
          hasNewCall = true;
          break;
        }
      }

      if (hasNewCall && buzzerEnabled && previousTokensRef.current.size > 0) {
        playChime();
      }

      previousTokensRef.current = currentActiveTokens;
    } catch (_) {}
  };

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.25); // G5
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (_) {}
  };

  useEffect(() => {
    fetchDisplay();
    const interval = setInterval(fetchDisplay, 2500);
    return () => clearInterval(interval);
  }, [buzzerEnabled]);

  const barbers = data?.barbers || [];
  const nextWaiting = data?.nextWaiting || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-12 flex flex-col justify-between select-none">
      {/* TV Header Bar */}
      <div className="flex items-center justify-between pb-8 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Scissors className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>{t.salonName}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-widest">
                Live TV
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.waitingRoomNotice}
            </p>
          </div>
        </div>

        {/* Audio Buzzer Enable Toggle */}
        <button
          type="button"
          onClick={() => {
            setBuzzerEnabled(!buzzerEnabled);
            if (!buzzerEnabled) playChime();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            buzzerEnabled
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {buzzerEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>{buzzerEnabled ? t.buzzerEnabled : t.enableBuzzer}</span>
        </button>
      </div>

      {/* Main Display Grid (1080p Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-8">
        {/* Left Section: Active Stylist Stations (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-emerald-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{t.nowServing} (Station Assigned)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {barbers.map((b) => {
              const hasToken = Boolean(b.currentToken);
              return (
                <div
                  key={b.slug}
                  className={`rounded-3xl p-6 border-2 transition-all flex flex-col justify-between min-h-[220px] ${
                    hasToken
                      ? 'bg-slate-900/90 border-emerald-500 shadow-xl shadow-emerald-950/40'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-300">
                      {b.name}
                    </span>
                    <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {b.onBreak ? 'Break' : (hasToken ? 'Active' : 'Available')}
                    </span>
                  </div>

                  <div className="text-center py-4">
                    {hasToken ? (
                      <div className="space-y-1">
                        <span className="text-xs uppercase tracking-wider text-amber-300 font-bold block">
                          Token
                        </span>
                        <div className="text-6xl font-heading font-extrabold text-white tracking-tight">
                          #{b.currentToken}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 font-medium">
                        {b.onBreak ? 'Taking Break' : 'Station Ready'}
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-center text-slate-400">
                    Station #{b.slug}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Section: Next 5 Waiting Tokens (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 rounded-3xl p-6 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{t.nextInLine}</span>
            </span>
            <span className="text-xs text-slate-400">Next 5 Tokens</span>
          </div>

          {nextWaiting.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No upcoming tokens in queue.
            </div>
          ) : (
            <div className="space-y-3">
              {nextWaiting.map((item, idx) => (
                <div
                  key={item.token}
                  className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <strong className="text-2xl font-heading font-extrabold text-white">
                      #{item.token}
                    </strong>
                  </div>
                  <span className="text-xs text-slate-400">
                    ~{item.durationMinutes} min service
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TV Footer */}
      <div className="text-center text-xs text-slate-500 pt-6 border-t border-slate-900">
        Tokens update automatically in real-time. For questions, please visit the reception desk.
      </div>
    </div>
  );
}
