import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { Scissors, Globe, User, LogOut, Ticket, Sparkles } from 'lucide-react';
import { getAuthToken, setAuthToken, getSavedQueueId } from '../api';

export default function Header({ lang, setLang, t, staffUser, setStaffUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const savedQueueId = getSavedQueueId();

  const handleLogout = () => {
    setAuthToken('');
    setStaffUser(null);
    navigate('/login');
  };

  const toggleLanguage = () => {
    const next = lang === 'en' ? 'gu' : 'en';
    setLang(next);
    localStorage.setItem('aura_lang', next);
  };

  const isStaffScreen = ['/reception', '/barber', '/admin'].some(p => location.pathname.startsWith(p));

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Salon Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/10 transition-transform group-hover:scale-105">
            <Scissors className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-lg text-slate-900 tracking-tight">
                {t.salonName}
              </span>
              <span className="inline-flex items-center text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                Luxe
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {t.salonTagline}
            </p>
          </div>
        </Link>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Ticket Quick Link */}
          {savedQueueId && !isStaffScreen && (
            <Link
              to={`/status/${savedQueueId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 transition-colors"
            >
              <Ticket className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.status}</span>
            </Link>
          )}

          {/* TV Display Link */}
          <Link
            to="/display"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <span>{t.tvDisplay}</span>
          </Link>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{lang === 'en' ? 'ગુજરાતી' : 'English'}</span>
          </button>

          {/* Staff User Controls */}
          {staffUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="text-xs font-medium text-slate-700 hidden sm:inline-block max-w-[120px] truncate">
                {staffUser.displayName || staffUser.email}
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title={t.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.login}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
