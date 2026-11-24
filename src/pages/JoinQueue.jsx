import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Scissors, Clock, Check, AlertCircle, ArrowLeft, User, Phone, CheckCircle2 } from 'lucide-react';
import { api, setSavedQueueId } from '../api';
import { normalizePhone, isValidIndianPhone } from '../../shared/validation';

export default function JoinQueue({ t, lang }) {
  const navigate = useNavigate();
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [barberPreference, setBarberPreference] = useState('');

  // Validation & Error State
  const [errors, setErrors] = useState({});
  const [conflictSpot, setConflictSpot] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getJoinOptions();
        setOptions(res);
        // Pre-select first service if available
        if (res.services && res.services.length > 0) {
          setSelectedServices([res.services[0].slug]);
        }
      } catch (err) {
        setErrors({ form: err.message || 'Failed to load options' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleService = (slug) => {
    if (selectedServices.includes(slug)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter(s => s !== slug));
      }
    } else {
      if (selectedServices.length < 3) {
        setSelectedServices([...selectedServices, slug]);
      }
    }
  };

  // Calculate totals
  const activeServiceList = (options?.services || []).filter(s => selectedServices.includes(s.slug));
  const totalDuration = activeServiceList.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPrice = activeServiceList.reduce((sum, s) => sum + s.price, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConflictSpot(null);
    const newErrors = {};

    if (!customerName.trim() || customerName.trim().length < 2) {
      newErrors.customerName = 'Please enter your full name (at least 2 characters)';
    }

    const cleanPhone = normalizePhone(phone);
    if (!isValidIndianPhone(cleanPhone)) {
      newErrors.phone = 'Please enter a valid 10-digit Indian mobile number';
    }

    if (selectedServices.length < 1 || selectedServices.length > 3) {
      newErrors.services = 'Please select between 1 and 3 services';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const res = await api.joinQueue({
        customerName: customerName.trim(),
        phone: cleanPhone,
        serviceSlugs: selectedServices,
        barberPreference: barberPreference || null,
      });

      if (res.id) {
        setSavedQueueId(res.id);
        navigate(`/status/${res.id}`);
      }
    } catch (err) {
      if (err.status === 409 && err.data?.activeId) {
        setConflictSpot({
          activeId: err.data.activeId,
          token: err.data.token,
          message: err.data.message || t.alreadyInQueueError,
        });
      } else {
        setErrors({ form: err.message || 'Failed to join queue. Please try again.' });
      }
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

  const hours = options?.hours || {};
  if (!hours.onlineAllowed) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-slate-900">{t.onlineJoiningClosed}</h2>
        <p className="text-sm text-slate-600">{t.onlineJoiningClosedDesc}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
          {t.joinTitle}
        </h1>
        <p className="text-sm text-slate-600">
          {t.joinSubtitle}
        </p>
      </div>

      {/* Conflict Alert (Active Ticket Exists) */}
      {conflictSpot && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">{t.alreadyInQueueError}</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Your mobile number currently holds active Token <strong>#{conflictSpot.token}</strong>.
              </p>
            </div>
          </div>
          <Link
            to={`/status/${conflictSpot.activeId}`}
            className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
          >
            {t.viewExistingSpot} (#{conflictSpot.token})
          </Link>
        </div>
      )}

      {errors.form && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* Join Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Info */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-slate-500">
            1. Your Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.fullName}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t.fullNamePlaceholder}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    errors.customerName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.customerName && (
                <p className="text-xs text-rose-600 mt-1">{errors.customerName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.mobileNumber}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-xs font-medium">
                  +91
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder={t.mobilePlaceholder}
                  className={`w-full pl-12 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    errors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                Used to verify your turn and track live queue progress.
              </p>
            </div>
          </div>
        </div>

        {/* Services Selection */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-slate-500">
              2. {t.selectServices}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {selectedServices.length}/3 Selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options?.services?.map((service) => {
              const isSelected = selectedServices.includes(service.slug);
              const displayName = lang === 'gu' ? service.nameGu : service.nameEn;

              return (
                <button
                  type="button"
                  key={service.slug}
                  onClick={() => toggleService(service.slug)}
                  className={`text-left p-3.5 rounded-xl border-2 transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-semibold text-sm text-slate-900 block">
                      {displayName}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {service.durationMinutes} {t.minutes}
                      </span>
                      <span>•</span>
                      <strong className="text-emerald-700 font-bold">
                        ₹{service.price}
                      </strong>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
          {errors.services && (
            <p className="text-xs text-rose-600">{errors.services}</p>
          )}
        </div>

        {/* Stylist Preference */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-slate-500">
            3. {t.chooseBarber}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Any Barber Card */}
            <button
              type="button"
              onClick={() => setBarberPreference('')}
              className={`text-left p-3.5 rounded-xl border-2 transition-all ${
                barberPreference === ''
                  ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-900">
                  {t.anyBarber}
                </span>
                {barberPreference === '' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className="text-xs text-slate-500">
                Recommended for fastest service
              </p>
            </button>

            {/* Individual Stylists */}
            {options?.barbers?.map((barber) => {
              const isSelected = barberPreference === barber.slug;
              return (
                <button
                  type="button"
                  key={barber.slug}
                  onClick={() => setBarberPreference(barber.slug)}
                  className={`text-left p-3.5 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900">
                      {barber.name}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {barber.onBreak ? (
                      <span className="text-rose-600 font-medium">Currently on break</span>
                    ) : (
                      'On duty'
                    )}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Summary Bar & Sticky Button */}
        <div className="sticky bottom-4 z-30 bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-xl shadow-slate-950/20 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-slate-400 block">{t.totalEstimatedTime}</span>
              <strong className="text-lg font-heading font-bold text-white">
                {totalDuration} {t.minutes}
              </strong>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div>
              <span className="text-xs text-slate-400 block">{t.totalPrice}</span>
              <strong className="text-xl font-heading font-bold text-amber-400">
                ₹{totalPrice}
              </strong>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-300 to-amber-400 hover:from-amber-400 hover:to-amber-500 shadow-md shadow-amber-950/20 transition-all disabled:opacity-50"
          >
            {submitting ? t.submitting : t.confirmJoin}
          </button>
        </div>
      </form>
    </div>
  );
}
