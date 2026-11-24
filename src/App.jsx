import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router';
import { translations } from './i18n/translations';
import { api, getAuthToken } from './api';
import Header from './components/Header';
import Home from './pages/Home';
import JoinQueue from './pages/JoinQueue';
import QueueStatus from './pages/QueueStatus';
import Reception from './pages/Reception';
import BarberView from './pages/BarberView';
import TvDisplay from './pages/TvDisplay';
import OwnerSettings from './pages/OwnerSettings';
import StaffLogin from './pages/StaffLogin';
import StaffSetup from './pages/StaffSetup';

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('aura_lang') || 'en');
  const [staffUser, setStaffUser] = useState(null);
  const location = useLocation();

  const t = translations[lang] || translations.en;

  // Validate active staff session on boot
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getMe()
        .then((user) => setStaffUser(user))
        .catch(() => setStaffUser(null));
    }
  }, []);

  // Update HTML lang attribute for Gujarati font rendering
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const isTvDisplay = location.pathname === '/display';

  return (
    <div className={`min-h-screen flex flex-col ${lang === 'gu' ? 'font-gujarati' : ''}`}>
      {!isTvDisplay && (
        <Header
          lang={lang}
          setLang={setLang}
          t={t}
          staffUser={staffUser}
          setStaffUser={setStaffUser}
        />
      )}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home t={t} lang={lang} />} />
          <Route path="/join" element={<JoinQueue t={t} lang={lang} />} />
          <Route path="/status/:id" element={<QueueStatus t={t} lang={lang} />} />
          <Route path="/reception" element={<Reception t={t} lang={lang} staffUser={staffUser} />} />
          <Route path="/barber" element={<BarberView t={t} lang={lang} staffUser={staffUser} />} />
          <Route path="/barber/:name" element={<BarberView t={t} lang={lang} staffUser={staffUser} />} />
          <Route path="/display" element={<TvDisplay t={t} lang={lang} />} />
          <Route path="/admin" element={<OwnerSettings t={t} lang={lang} staffUser={staffUser} />} />
          <Route path="/login" element={<StaffLogin t={t} lang={lang} setStaffUser={setStaffUser} />} />
          <Route path="/setup/:token" element={<StaffSetup t={t} lang={lang} />} />
        </Routes>
      </main>
    </div>
  );
}
