import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Users, UserPlus, Phone, Clock, AlertTriangle, CheckCircle2,
  XCircle, Coffee, Scissors, ArrowRight, X, Sparkles, RefreshCw
} from 'lucide-react';
import { api } from '../api';
import { normalizePhone, isValidIndianPhone } from '../../shared/validation';

export default function Reception({ t, lang, staffUser }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Walk-in modal state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInServices, setWalkInServices] = useState([]);
  const [walkInBarber, setWalkInBarber] = useState('');
  const [servicesCatalog, setServicesCatalog] = useState([]);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInError, setWalkInError] = useState(null);

  // Calling next state
  const [callingBarber, setCallingBarber] = useState(null);

  const fetchReception = async () => {
    try {
      const res = await api.getReception();
      setData(res);
      setError(null);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        navigate('/login?redirect=/reception');
      } else {
        setError(err.message || 'Failed to load reception data');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadServicesCatalog = async () => {
    try {
      const res = await api.getJoinOptions();
      setServicesCatalog(res.services || []);
      if (res.services?.length > 0 && walkInServices.length === 0) {
        setWalkInServices([res.services[0].slug]);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchReception();
    loadServicesCatalog();
    const interval = setInterval(fetchReception, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCallNext = async (barberSlug) => {
    setCallingBarber(barberSlug);
    try {
      await api.callNext(barberSlug);
      fetchReception();
    } catch (err) {
      alert(err.message || 'Unable to call next customer');
    } finally {
      setCallingBarber(null);
    }
  };

  const handleReceptionAction = async (token, action) => {
    try {
      await api.receptionEntryAction(token, action);
      fetchReception();
    } catch (err) {
      alert(err.message || `Failed to perform ${action}`);
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    setWalkInError(null);

    const cleanPhone = normalizePhone(walkInPhone);
    if (!walkInName.trim()) {
      setWalkInError('Please enter customer name');
      return;
    }
    if (!isValidIndianPhone(cleanPhone)) {
      setWalkInError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    if (walkInServices.length < 1 || walkInServices.length > 3) {
      setWalkInError('Please select 1 to 3 services');
      return;
    }

    setWalkInSubmitting(true);
    try {
      await api.addWalkIn({
        customerName: walkInName.trim(),
        phone: cleanPhone,
        serviceSlugs: walkInServices,
        barberPreference: walkInBarber || null,
      });

      setShowWalkInModal(false);
      setWalkInName('');
      setWalkInPhone('');
      fetchReception();
    } catch (err) {
      setWalkInError(err.message || 'Failed to add walk-in');
    } finally {
      setWalkInSubmitting(false);
    }
  };

  const toggleWalkInService = (slug) => {
    if (walkInServices.includes(slug)) {
      if (walkInServices.length > 1) {
        setWalkInServices(walkInServices.filter(s => s !== slug));
      }
    } else {
      if (walkInServices.length < 3) {
        setWalkInServices([...walkInServices, slug]);
      }
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const waitingList = data?.waitingList || [];
  const barbers = data?.barbers || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Bar with Live Indicator & Walk-in Button */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900">
              {t.receptionTitle}
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Total Waiting: <strong className="text-slate-900 font-bold">{waitingList.length}</strong> clients in queue
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowWalkInModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t.walkIn}</span>
        </button>
      </div>

      {/* Stylist Stations / Cards Across Top (Landscape Tablet Optimized) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {barbers.map((barber) => {
          const entry = barber.currentEntry;
          const isServing = entry?.status === 'in_chair';
          const isCalled = entry?.status === 'called';

          return (
            <div
              key={barber.slug}
              className={`rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                barber.onBreak
                  ? 'bg-rose-50/40 border-rose-200'
                  : entry
                  ? 'bg-white border-emerald-300 shadow-xs'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    {barber.name}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {barber.onBreak
                      ? 'On break'
                      : entry
                      ? isServing ? 'In Chair' : 'Client Called'
                      : 'Station Available'}
                  </span>
                </div>

                {barber.onBreak ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 flex items-center gap-1">
                    <Coffee className="w-3 h-3" />
                    <span>{t.onBreak}</span>
                  </span>
                ) : entry ? (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Token #{entry.token}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                    {t.available}
                  </span>
                )}
              </div>

              {/* Station Current Activity */}
              {entry ? (
                <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 border border-slate-100">
                  <div className="flex justify-between items-start text-xs">
                    <div>
                      <strong className="text-slate-900 font-bold block">{entry.customerName}</strong>
                      <span className="text-[11px] text-slate-500">{entry.serviceNames}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700">
                      {isServing ? `${entry.remainingMinutes}m left` : `Called ${entry.elapsedMinutes}m ago`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(10, (entry.elapsedMinutes / Math.max(1, entry.durationMinutes)) * 100))}%`
                      }}
                    ></div>
                  </div>

                  {/* No-show option for called entry */}
                  {isCalled && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        disabled={!entry.canNoShow}
                        onClick={() => handleReceptionAction(entry.token, 'no-show')}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                          entry.canNoShow
                            ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                        title={!entry.canNoShow ? t.noShowTooEarly : ''}
                      >
                        {t.markNoShow} {!entry.canNoShow && `(${10 - entry.elapsedMinutes}m)`}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  {barber.onBreak ? 'Stylist on break' : 'Ready for next client'}
                </div>
              )}

              {/* Call Next Button */}
              <button
                type="button"
                disabled={!barber.canCallNext || callingBarber === barber.slug}
                onClick={() => handleCallNext(barber.slug)}
                className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-slate-900 hover:bg-emerald-700 text-white"
              >
                <span>{callingBarber === barber.slug ? 'Calling...' : t.callNext}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Waiting List (Arrival Order) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-heading font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>{t.waitingArrivalList}</span>
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {waitingList.length} Waiting
          </span>
        </div>

        {waitingList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No clients currently waiting in the queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Token</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Services</th>
                  <th className="py-3 px-4">Stylist Pref.</th>
                  <th className="py-3 px-4">{t.waitSoFar}</th>
                  <th className="py-3 px-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waitingList.map((client) => (
                  <tr key={client.token} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-heading font-bold text-slate-950 text-sm">
                        #{client.token}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {client.customerName}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {client.phone}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                      {client.serviceNames}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] bg-slate-100 font-medium text-slate-700">
                        {client.barberPreference || 'Any Stylist'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {client.isOverHour ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>{client.waitSoFarMinutes} min</span>
                        </span>
                      ) : (
                        <span className="text-slate-600 font-medium">
                          {client.waitSoFarMinutes} min
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleReceptionAction(client.token, 'cancel')}
                        className="text-rose-600 hover:text-rose-800 font-semibold text-xs px-2 py-1 rounded-md hover:bg-rose-50 transition-colors"
                      >
                        {t.cancelEntry}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Walk-in Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-heading font-bold text-slate-900">
                {t.addWalkInTitle}
              </h3>
              <button
                onClick={() => setShowWalkInModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {walkInError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {walkInError}
              </p>
            )}

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Full Name
                </label>
                <input
                  type="text"
                  required
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  10-Digit Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Services (1 to 3)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {servicesCatalog.map((s) => {
                    const isSelected = walkInServices.includes(s.slug);
                    return (
                      <button
                        type="button"
                        key={s.slug}
                        onClick={() => toggleWalkInService(s.slug)}
                        className={`text-left p-2 rounded-xl border text-xs transition-colors flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-900'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{s.nameEn}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          {s.durationMinutes}m · ₹{s.price}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stylist Preference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stylist Preference
                </label>
                <select
                  value={walkInBarber}
                  onChange={(e) => setWalkInBarber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Any Stylist (First Available)</option>
                  {barbers.map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walkInSubmitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  {walkInSubmitting ? 'Registering...' : t.addWalkInBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
