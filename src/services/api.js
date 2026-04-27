import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.tafahom.io';
const WS_URL = import.meta.env.VITE_WS_URL || 'wss://api.tafahom.io';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =========================
// INTERCEPTORS
// =========================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// =========================
// AUTH
// =========================
export const authService = {
  login: (data) => api.post('/authentication/login/', data),
  login2FA: (data) => api.post('/authentication/login/2fa/', data),
  enable2FA: () => api.post('/authentication/2fa/enable/'),
  disable2FA: () => api.post('/authentication/2fa/disable/'),
  setup2FA: () => api.post('/authentication/2fa/setup/'),
  refresh: () => api.post('/authentication/token/refresh/'),
};

// =========================
// USERS
// =========================
export const userService = {
  me: () => api.get('/users/me/'),
  update: (data) => api.put('/users/me/update/', data),
  updateEmail: (data) => api.patch('/users/me/email/', data),
  registerBasic: (data) => api.post('/users/register/basic/', data),
  registerOrg: (data) => api.post('/users/register/organization/', data),
};

// =========================
// TRANSLATION
// =========================
export const translationService = {
  createRequest: (data) => api.post('/translation/requests/', data),
  myRequests: () => api.get('/translation/requests/me/'),
  getStatus: (id) => api.get(`/translation/status/${id}/`),
  toSign: (data) => api.post('/translation/to-sign/', data),
  speechToText: (formData) =>
    api.post('/translation/speech-to-text/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getSignLanguages: () => api.get('/translation/sign-languages/'),
};

export const translatorService = {
  translate: (videoBlob) => {
    const formData = new FormData();
    formData.append('video', videoBlob);
    return api.post('/translation/translate/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const generatorService = {
  generate: (text) => api.post('/translation/to-sign/', { text }),
};

// =========================
// MEETINGS
// =========================
export const meetingService = {
  create: (data) => api.post('/meetings/create/', data),
  join: (code, data) => api.post(`/meetings/join/${code}/`, data),
  leave: (code) => api.post(`/meetings/leave/${code}/`),
  end: (code) => api.post(`/meetings/end/${code}/`),
  participants: (code) => api.get(`/meetings/participants/${code}/`),
};

// =========================
// DATASET
// =========================
export const datasetService = {
  contribute: (formData) =>
    api.post('/dataset/contributions/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  myContributions: () => api.get('/dataset/contributions/me/'),
  pending: () => api.get('/dataset/admin/contributions/pending/'),
  approve: (id) => api.post(`/dataset/admin/contributions/${id}/approve/`),
  reject: (id) => api.post(`/dataset/admin/contributions/${id}/reject/`),
};

// =========================
// BILLING
// =========================
export const billingService = {
  plans: () => api.get('/billing/plans/'),
  mySubscription: () => api.get('/billing/my-subscription/'),
  tokensAnalytics: () => api.get('/billing/me/tokens/analytics/'),
  subscribe: (data) => api.post('/billing/subscribe/', data),
  cancel: () => api.post('/billing/cancel/'),
  myTokens: () => api.get('/billing/me/tokens/'),
};

// =========================
// LOCALIZATION
// =========================
export const localizationService = {
  languages: () => api.get('/localization/languages/'),
  setLanguage: (data) => api.post('/localization/set-language/', data),
  keys: () => api.get('/localization/keys/'),
  getKey: (id) => api.get(`/localization/keys/${id}/`),
};

// =========================
// HEALTH
// =========================
export const healthService = {
  health: () => api.get('/health/health/'),
  ready: () => api.get('/health/ready/'),
};

// =========================
// WEBSOCKET
// =========================
let ws = null;

export const wsService = {
  connect: (onMessage) => {
    const token = localStorage.getItem('token');
    ws = new WebSocket(`${WS_URL}/ws/translation/stream?token=${token}`);

    ws.onmessage = (event) => {
      onMessage(JSON.parse(event.data));
    };
  },
  send: (data) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  },
  disconnect: () => {
    ws?.close();
  },
};

export default api;