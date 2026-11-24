const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('aura_staff_token') || '';
}

export function setAuthToken(token) {
  if (token) localStorage.setItem('aura_staff_token', token);
  else localStorage.removeItem('aura_staff_token');
}

export function getSavedQueueId() {
  return localStorage.getItem('aura_queue_id') || '';
}

export function setSavedQueueId(id) {
  if (id) localStorage.setItem('aura_queue_id', id);
  else localStorage.removeItem('aura_queue_id');
}

export async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.error || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Public
  getHome: () => apiRequest('/home'),
  getJoinOptions: () => apiRequest('/join'),
  joinQueue: (payload) => apiRequest('/join', { method: 'POST', body: JSON.stringify(payload) }),
  getStatus: (id) => apiRequest(`/status/${id}`),
  cancelStatus: (id) => apiRequest(`/status/${id}/cancel`, { method: 'POST' }),
  getTvDisplay: () => apiRequest('/display'),

  // Staff Auth
  login: (credentials) => apiRequest('/staff/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => apiRequest('/staff/logout', { method: 'POST' }),
  getMe: () => apiRequest('/staff/me'),
  getInvitation: (token) => apiRequest(`/staff/invitations/${token}`),
  completeSetup: (payload) => apiRequest('/staff/setup', { method: 'POST', body: JSON.stringify(payload) }),

  // Reception
  getReception: () => apiRequest('/reception'),
  addWalkIn: (payload) => apiRequest('/reception/walk-ins', { method: 'POST', body: JSON.stringify(payload) }),
  callNext: (barberSlug) => apiRequest(`/reception/barbers/${barberSlug}/call-next`, { method: 'POST' }),
  receptionEntryAction: (token, action) => apiRequest(`/reception/entries/${token}/${action}`, { method: 'POST' }),

  // Barber
  getBarberView: (slug) => apiRequest(`/barber/${slug}`),
  setBarberBreak: (slug, onBreak) => apiRequest(`/barber/${slug}/break`, { method: 'POST', body: JSON.stringify({ onBreak }) }),
  barberEntryAction: (slug, token, action) => apiRequest(`/barber/${slug}/entries/${token}/${action}`, { method: 'POST' }),

  // Admin / Owner
  getAdmin: () => apiRequest('/admin'),
  setOnlineJoining: (open) => apiRequest('/admin/online-joining', { method: 'POST', body: JSON.stringify({ open }) }),
  updateService: (slug, payload) => apiRequest(`/admin/services/${slug}`, { method: 'POST', body: JSON.stringify(payload) }),
  setBarberDuty: (slug, onDuty) => apiRequest(`/admin/barbers/${slug}/duty`, { method: 'POST', body: JSON.stringify({ onDuty }) }),
  inviteStaff: (payload) => apiRequest('/admin/staff-invitations', { method: 'POST', body: JSON.stringify(payload) }),
};
