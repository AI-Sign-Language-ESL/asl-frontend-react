import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.tafahom.io';
const WS_URL = import.meta.env.VITE_WS_URL || 'wss://api.tafahom.io';

const api = axios.create({
  baseURL: `${API_URL}/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH
// ============================================================

export const authService = {
  login: (credentials) => api.post('/authentication/login', credentials),
  login2FA: (data) => api.post('/authentication/login/2fa', data),
  loginGoogle: () => api.get('/authentication/login/google'),
  register: (userData) => api.post('/authentication/register', userData),
  logout: () => api.post('/authentication/logout'),
  refresh: () => api.post('/auth/refresh'),
  me: () => api.get('/auth/me'),
};

// ============================================================
// USER
// ============================================================

export const userService = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  changePassword: (data) => api.put('/users/password', data),
  deleteAccount: () => api.delete('/users/account'),
};

// ============================================================
// TRANSLATION
// ============================================================

export const translatorService = {
  // Text to Sign (5 tokens) or Sign to Text
  translateText: (data) => api.post('/translation/text', data),
  
  // Text to Sign video (10 tokens)
  toSign: (data) => api.post('/translation/to-sign', data),
  
  // Audio to Text (5 tokens)
  speechToText: (formData) => api.post('/translation/speech-to-text', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  
  // List sign languages
  getSignList: () => api.get('/translation/sign-list'),
  
  // Get history
  getHistory: (page = 1) => api.get(`/translation/history?page=${page}`),
};

// ============================================================
// WEBSOCKET
// ============================================================

let ws = null;
let wsCallback = null;

export const wsService = {
  connect: (onMessage) => {
    const token = localStorage.getItem('token');
    wsCallback = onMessage;
    
    ws = new WebSocket(`${WS_URL}/ws/translation/stream?token=${token}`);
    
    ws.onopen = () => console.log('WS connected');
    ws.onmessage = (event) => {
      if (wsCallback) {
        wsCallback(JSON.parse(event.data));
      }
    };
    ws.onclose = () => console.log('WS disconnected');
    ws.onerror = (err) => console.error('WS error:', err);
  },
  
  send: (data) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  },
  
  disconnect: () => {
    if (ws) {
      ws.close();
      ws = null;
    }
  },
};

// ============================================================
// GENERATOR (Text → Sign Avatar)
// ============================================================

export const generatorService = {
  generate: (text) => api.post('/translation/to-sign', { text }),
  getSupportedPhrases: () => api.get('/translation/sign-list'),
};

// ============================================================
// DATASET
// ============================================================

export const datasetService = {
  upload: (formData) => api.post('/dataset/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyContributions: () => api.get('/dataset/my-contributions'),
  deleteContribution: (id) => api.delete(`/dataset/contribution/${id}`),
  getStats: () => api.get('/dataset/stats'),
};

// ============================================================
// MEETINGS
// ============================================================

export const meetingService = {
  create: (data) => api.post('/meetings', data),
  join: (meetingId, data) => api.post(`/meetings/${meetingId}/join`, data),
  leave: (meetingId) => api.post(`/meetings/${meetingId}/leave`),
  get: (meetingId) => api.get(`/meetings/${meetingId}`),
  myMeetings: () => api.get('/meetings/my'),
  schedule: (data) => api.post('/meetings/schedule', data),
  updatePassword: (meetingId, data) => api.put(`/meetings/${meetingId}/password`, data),
  kick: (meetingId, userId) => api.delete(`/meetings/${meetingId}/participants/${userId}`),
};

// ============================================================
// BILLING
// ============================================================

export const billingService = {
  getSubscription: () => api.get('/billing/subscription'),
  getInvoices: () => api.get('/billing/invoices'),
  subscribe: (planId) => api.post('/billing/subscribe', { planId }),
  cancel: () => api.delete('/billing/subscription'),
  updatePaymentMethod: (data) => api.put('/billing/payment-method', data),
};

// ============================================================
// NOTIFICATIONS
// ============================================================

export const notificationService = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ============================================================
// SETTINGS
// ============================================================

export const settingsService = {
  getPreferences: () => api.get('/settings/preferences'),
  updatePreferences: (data) => api.put('/settings/preferences', data),
};

export default api;