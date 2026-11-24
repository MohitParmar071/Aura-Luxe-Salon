import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Settings, Users, DollarSign, Clock, UserCheck, ShieldAlert,
  ToggleLeft, ToggleRight, Plus, Check, AlertCircle, Copy, Link as LinkIcon
} from 'lucide-react';
import { api } from '../api';

export default function OwnerSettings({ t }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Invite Staff Form
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('barber');
  const [inviteBarberSlug, setInviteBarberSlug] = useState('arjun');
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Service Edit State
  const [editingService, setEditingService] = useState(null);
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');

  const fetchAdmin = async () => {
    try {
      const res = await api.getAdmin();
      setData(res);
      setError(null);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        navigate('/login?redirect=/admin');
      } else {
        setError(err.message || 'Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmin();
  }, []);

  const handleToggleOnlineJoining = async () => {
    if (!data?.settings) return;
    const nextState = !data.settings.onlineJoiningOpen;
    try {
      await api.setOnlineJoining(nextState);
      fetchAdmin();
    } catch (err) {
      alert(err.message || 'Failed to update online joining state');
    }
  };

  const handleToggleBarberDuty = async (slug, currentDuty) => {
    try {
      await api.setBarberDuty(slug, !currentDuty);
      fetchAdmin();
    } catch (err) {
      alert(err.message || 'Failed to toggle duty');
    }
  };

  const handleToggleServiceActive = async (slug, currentActive) => {
    try {
      await api.updateService(slug, { active: !currentActive });
      fetchAdmin();
    } catch (err) {
      alert(err.message || 'Failed to toggle service');
    }
  };

  const handleSaveService = async (slug) => {
    try {
      await api.updateService(slug, {
        price: Number(servicePrice),
        durationMinutes: Number(serviceDuration),
      });
      setEditingService(null);
      fetchAdmin();
    } catch (err) {
      alert(err.message || 'Failed to update service');
    }
  };

  const handleCreateInvitation = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    setGeneratedInviteUrl('');
    try {
      const res = await api.inviteStaff({
        displayName: inviteName,
        email: inviteEmail,
        role: inviteRole,
        barberSlug: inviteRole === 'barber' ? inviteBarberSlug : null,
      });

      const fullUrl = `${window.location.origin}${res.setupUrl}`;
      setGeneratedInviteUrl(fullUrl);
      setInviteName('');
      setInviteEmail('');
    } catch (err) {
      alert(err.message || 'Failed to generate invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const copyInviteToClipboard = () => {
    if (generatedInviteUrl) {
      navigator.clipboard.writeText(generatedInviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const settings = data?.settings || {};
  const services = data?.services || [];
  const barbers = data?.barbers || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900">
          {t.adminTitle}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor performance metrics, manage services catalog, staff duty & system access.
        </p>
      </div>

      {/* KPI Metrics Today */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            {t.customersServed}
          </span>
          <strong className="text-2xl sm:text-3xl font-heading font-bold text-emerald-700">
            {stats.totalServed}
          </strong>
          <span className="text-[11px] text-slate-400 block">Today's served</span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            {t.averageWait}
          </span>
          <strong className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
            {stats.avgWaitMinutes} min
          </strong>
          <span className="text-[11px] text-slate-400 block">Entry to chair</span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            {t.noShowsCount}
          </span>
          <strong className="text-2xl sm:text-3xl font-heading font-bold text-rose-600">
            {stats.noShowsCount}
          </strong>
          <span className="text-[11px] text-slate-400 block">After 10m call</span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            {t.cancellationsCount}
          </span>
          <strong className="text-2xl sm:text-3xl font-heading font-bold text-slate-700">
            {stats.cancelledCount}
          </strong>
          <span className="text-[11px] text-slate-400 block">Client cancellations</span>
        </div>
      </div>

      {/* Online Joining Control Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-heading font-bold text-slate-900">
            {t.onlineJoiningControl}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {settings.onlineJoiningOpen ? t.onlineJoiningActive : t.onlineJoiningDisabled}
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleOnlineJoining}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            settings.onlineJoiningOpen
              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {settings.onlineJoiningOpen ? 'Close Online Queue' : 'Open Online Queue'}
        </button>
      </div>

      {/* Barbers Duty Management */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        <h2 className="text-base font-heading font-bold text-slate-900">
          Stylists on Duty Roster
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {barbers.map((b) => (
            <div
              key={b.slug}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
            >
              <div>
                <strong className="text-sm font-bold text-slate-900 block">{b.name}</strong>
                <span className="text-xs text-slate-500">
                  {b.onDuty ? 'Rostered on Duty' : 'Off Duty'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleToggleBarberDuty(b.slug, b.onDuty)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  b.onDuty
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {b.onDuty ? 'On Duty' : 'Off Duty'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Services Catalog & Pricing */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        <h2 className="text-base font-heading font-bold text-slate-900">
          {t.manageServices} (Indian Rupee ₹ & Durations)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Service Name</th>
                <th className="py-2.5 px-3">Duration (min)</th>
                <th className="py-2.5 px-3">Price (₹)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((s) => {
                const isEditing = editingService === s.slug;
                return (
                  <tr key={s.slug} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3">
                      <strong className="font-semibold text-slate-900 block">{s.nameEn}</strong>
                      <span className="text-[11px] text-slate-500">{s.nameGu}</span>
                    </td>
                    <td className="py-3 px-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={serviceDuration}
                          onChange={(e) => setServiceDuration(e.target.value)}
                          className="w-16 px-2 py-1 rounded border border-slate-300 text-xs"
                        />
                      ) : (
                        <span>{s.durationMinutes} min</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={servicePrice}
                          onChange={(e) => setServicePrice(e.target.value)}
                          className="w-20 px-2 py-1 rounded border border-slate-300 text-xs"
                        />
                      ) : (
                        <strong className="font-bold text-emerald-800">₹{s.price}</strong>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleServiceActive(s.slug, s.active)}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          s.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {s.active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleSaveService(s.slug)}
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-xs"
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingService(s.slug);
                            setServicePrice(s.price);
                            setServiceDuration(s.durationMinutes);
                          }}
                          className="text-slate-600 hover:text-slate-900 font-semibold"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Invitation Generator */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        <h2 className="text-base font-heading font-bold text-slate-900">
          {t.staffInvitations}
        </h2>

        <form onSubmit={handleCreateInvitation} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.staffName}</label>
            <input
              type="text"
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="e.g. Sunil Verma"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.staffEmail}</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="sunil@auraluxe.in"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.staffRole}</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
            >
              <option value="receptionist">Receptionist</option>
              <option value="barber">Barber / Stylist</option>
              <option value="owner">Co-Owner</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={inviteLoading}
              className="w-full py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
            >
              {inviteLoading ? 'Generating...' : t.sendInvite}
            </button>
          </div>
        </form>

        {/* Display generated setup link */}
        {generatedInviteUrl && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
            <p className="text-xs font-bold text-emerald-900">
              One-Time Setup Link Generated! Share this privately with the staff member:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedInviteUrl}
                className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-xs font-mono text-slate-800"
              />
              <button
                type="button"
                onClick={copyInviteToClipboard}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
