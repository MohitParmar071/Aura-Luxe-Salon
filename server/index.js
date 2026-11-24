import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDatabase } from './db.js';
import {
  callNext, cancelQueueSpot, finishReceptionEntry, getBarberView, getHome,
  getJoinOptions, getOwnerSettings, getQueueStatus, getReception, getTvDisplay,
  joinQueue, setBarberBreak, setBarberDuty, setOnlineJoining, updateBarberEntry,
  updateService,
} from './queue.js';
import {
  authenticateRequest, completeStaffSetup, createStaffInvitation, getInvitation,
  loginStaff, logoutStaff,
} from './staff.js';

const currentDir = typeof __dirname !== 'undefined'
  ? __dirname
  : (typeof import.meta !== 'undefined' && import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : process.cwd());

const app = express();
const PORT = process.env.PORT || 3001;

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '64kb' }));

// No-cache header for all API responses
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// Public customer queue endpoints
app.get('/api/home', async (_req, res) => {
  try {
    const data = await getHome();
    res.json(data);
  } catch (err) {
    console.error('Home error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

app.get('/api/join', async (_req, res) => {
  try {
    const data = await getJoinOptions();
    res.json(data);
  } catch (err) {
    console.error('Join options error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

app.post('/api/join', async (req, res) => {
  try {
    const result = await joinQueue(req.body, 'online');
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Join error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

app.get('/api/status/:id', async (req, res) => {
  try {
    const data = await getQueueStatus(req.params.id);
    if (!data) return res.status(404).json({ error: 'statusNotFound' });
    res.json(data);
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

app.post('/api/status/:id/cancel', async (req, res) => {
  try {
    const result = await cancelQueueSpot(req.params.id);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// Waiting Room TV Display
app.get('/api/display', async (_req, res) => {
  try {
    const data = await getTvDisplay();
    res.json(data);
  } catch (err) {
    console.error('Display error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// Staff Authentication
app.post('/api/staff/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const result = await loginStaff(email, password);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

app.post('/api/staff/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.slice(7).trim();
    const result = await logoutStaff(token);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

app.get('/api/staff/me', async (req, res) => {
  try {
    const session = await authenticateRequest(req);
    if (!session) return res.status(401).json({ error: 'unauthorized' });
    res.json({
      email: session.email,
      role: session.role,
      barberSlug: session.barber_slug,
    });
  } catch (err) {
    console.error('Session error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// Staff Invitation setup
app.get('/api/staff/invitations/:token', async (req, res) => {
  try {
    const inv = await getInvitation(req.params.token);
    if (!inv) return res.status(404).json({ error: 'invalidOrExpiredToken' });
    res.json(inv);
  } catch (err) {
    console.error('Invitation error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

app.post('/api/staff/setup', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    const result = await completeStaffSetup(token, password);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Setup error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// Reception Dashboard endpoints (Protected)
app.use('/api/reception', async (req, res, next) => {
  const session = await authenticateRequest(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });
  if (session.role !== 'receptionist' && session.role !== 'owner') {
    return res.status(403).json({ error: 'forbidden' });
  }
  res.locals.session = session;
  next();
});

app.get('/api/reception', async (_req, res) => {
  try {
    const data = await getReception();
    res.json(data);
  } catch (err) {
    console.error('Reception error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

app.post('/api/reception/walk-ins', async (req, res) => {
  try {
    const result = await joinQueue(req.body, 'walk_in');
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Walk-in error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

app.post('/api/reception/barbers/:slug/call-next', async (req, res) => {
  try {
    const result = await callNext(req.params.slug);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Call next error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

app.post('/api/reception/entries/:token/:action', async (req, res) => {
  try {
    const token = Number(req.params.token);
    const { action } = req.params;
    if (!Number.isSafeInteger(token) || !['cancel', 'no-show'].includes(action)) {
      return res.status(400).json({ error: 'invalidParams' });
    }
    const result = await finishReceptionEntry(token, action);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Reception finish entry error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// Barber View endpoints (Protected)
app.use('/api/barber/:slug', async (req, res, next) => {
  const session = await authenticateRequest(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });
  if (session.role === 'barber' && session.barber_slug !== req.params.slug) {
    return res.status(403).json({ error: 'forbidden', message: 'You can only access your own profile' });
  }
  if (session.role !== 'barber' && session.role !== 'owner') {
    return res.status(403).json({ error: 'forbidden' });
  }
  res.locals.session = session;
  next();
});

app.get('/api/barber/:slug', async (req, res) => {
  try {
    const data = await getBarberView(req.params.slug);
    if (!data) return res.status(404).json({ error: 'barberNotFound' });
    res.json(data);
  } catch (err) {
    console.error('Barber view error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

app.post('/api/barber/:slug/break', async (req, res) => {
  try {
    const result = await setBarberBreak(req.params.slug, req.body?.onBreak);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Barber break error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

app.post('/api/barber/:slug/entries/:token/:action', async (req, res) => {
  try {
    const token = Number(req.params.token);
    const { slug, action } = req.params;
    if (!Number.isSafeInteger(token) || !['start', 'done'].includes(action)) {
      return res.status(400).json({ error: 'invalidParams' });
    }
    const result = await updateBarberEntry(slug, token, action);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Barber entry update error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// Owner Settings & Analytics endpoints (Protected)
app.use('/api/admin', async (req, res, next) => {
  const session = await authenticateRequest(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });
  if (session.role !== 'owner') return res.status(403).json({ error: 'forbidden' });
  res.locals.session = session;
  next();
});

app.get('/api/admin', async (_req, res) => {
  try {
    const data = await getOwnerSettings();
    res.json(data);
  } catch (err) {
    console.error('Admin error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

app.post('/api/admin/online-joining', async (req, res) => {
  try {
    const result = await setOnlineJoining(req.body?.open);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Admin online joining error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

app.post('/api/admin/services/:slug', async (req, res) => {
  try {
    const result = await updateService(req.params.slug, req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Admin update service error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

app.post('/api/admin/barbers/:slug/duty', async (req, res) => {
  try {
    const result = await setBarberDuty(req.params.slug, req.body?.onDuty);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Admin barber duty error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

app.post('/api/admin/staff-invitations', async (req, res) => {
  try {
    const result = await createStaffInvitation(req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Admin invite staff error:', err);
    res.status(500).json({ error: 'serverError' });
  }
});

// Serve frontend static build in production
const distDir = path.resolve(currentDir, '../dist');
app.use(express.static(distDir));

// Fallback to index.html for SPA client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.resolve(distDir, 'index.html'));
});

// Start server after initializing DB if not imported as serverless function
initDatabase()
  .then(() => {
    if (!process.env.VERCEL && !process.env.NETLIFY) {
      app.listen(PORT, () => {
        console.log(`✨ Aura Luxe Salon server listening on port ${PORT}`);
      });
    }
  })
  .catch((err) => {
    console.error('Database initialization warning:', err);
  });

export default app;
