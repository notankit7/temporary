// API service layer — talks to the Node.js / Express / MongoDB backend in /backend.
//
// In development, Vite proxies /api to http://localhost:5000 (see vite.config.js).
// To point at a backend elsewhere, set VITE_API_URL in a .env file, e.g.
//   VITE_API_URL=http://192.168.1.20:5000/api

const API_URL = import.meta.env.VITE_API_URL || '/api';

/* ─── Session (token + user saved in localStorage) ─── */

export const getToken = () => localStorage.getItem('auth_token');

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
};

export const saveSession = ({ token, user }) => {
  if (token) localStorage.setItem('auth_token', token);
  if (user) localStorage.setItem('user', JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};

/* ─── Core request helper ─── */

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  // Token expired or invalid — send the user back to login.
  if (res.status === 401 && token) {
    clearSession();
    window.location.assign('/login');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || 'Server unavailable. Is the backend running?');
  }
  return data;
}

/* ─── Auth ─── */

export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: { email, password } });

export const register = (form) =>
  request('/auth/register', { method: 'POST', body: form });

export const fetchMe = () => request('/auth/me');

export const updateProfile = (changes) => request('/auth/me', { method: 'PUT', body: changes });

/* ─── Sensors ─── */

export const fetchSensorData = () => request('/sensors');

export const fetchSensorHistory = (hours = 24) => request(`/sensors/history?hours=${hours}`);

// Returns { reading, alerts } — alerts are any new alerts the reading raised.
export const simulateReading = () => request('/sensors/simulate', { method: 'POST' });

/* ─── Advisory & irrigation ─── */

export const fetchAdvisoryData = () => request('/advisory');

export const logIrrigation = (waterMm) =>
  request('/irrigation', { method: 'POST', body: waterMm ? { waterMm } : {} });

export const fetchIrrigationHistory = () => request('/irrigation');

/* ─── Alerts ─── */

export const fetchAlertsData = ({ type, limit } = {}) => {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (limit) params.set('limit', limit);
  const qs = params.toString();
  return request(`/alerts${qs ? `?${qs}` : ''}`);
};

export const markAlertRead = (id) => request(`/alerts/${id}/read`, { method: 'PATCH' });

export const markAllAlertsRead = () => request('/alerts/read-all', { method: 'PATCH' });

export const deleteAlert = (id) => request(`/alerts/${id}`, { method: 'DELETE' });

/* ─── Crop & weather ─── */

export const fetchMyCrop = () => request('/crops/mine');

export const fetchWeather = () => request('/weather');
