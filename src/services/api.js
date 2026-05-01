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
      const url = err.config?.url || '';
      const isAuthEndpoint = url.includes('/authentication/login') ||
                           url.includes('/authentication/login/2fa') ||
                           url.includes('/authentication/login/google') ||
                           url.includes('/users/register');

      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
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
  verifyEmail: (data) => api.post('/authentication/verify-email/', data),
  resendCode: (email) => api.post('/authentication/resend-code/', { email }),
  loginGoogle: (data) => api.post('/authentication/login/google/', data),
  sendResetEmail: (email) => api.post('/authentication/password/reset/', { email }),
  confirmReset: (token, newPassword, confirmPassword) => api.post('/authentication/password/reset/confirm/', { token, new_password: newPassword, confirm_password: confirmPassword }),
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

   // Admin
  adminList: (params) => api.get('/users/admin/users/', { params }),
  adminDetail: (id) => api.get(`/users/admin/users/${id}/`),
  adminChangePlan: (userId, data) => api.post(`/users/admin/users/${userId}/change-plan/`, data),
  adminAddTokens: (userId, data) => api.post(`/users/admin/users/${userId}/add-tokens/`, data),
  adminRemoveTokens: (userId, data) => api.post(`/users/admin/users/${userId}/remove-tokens/`, data),
  adminSubscriptionStatus: (userId, data) => api.post(`/users/admin/users/${userId}/subscription-status/`, data),
  adminTransactions: (params) => api.get('/users/admin/transactions/', { params }),
  adminStats: () => api.get('/users/admin/dashboard-stats/'),

  // Supervisor
  supervisorContributions: (params) => api.get('/users/supervisor/contributions/', { params }),
  supervisorApprove: (id) => api.post(`/users/supervisor/contributions/${id}/approve/`),
  supervisorReject: (id) => api.post(`/users/supervisor/contributions/${id}/reject/`),

  // Organization Admin
  orgMembers: () => api.get('/users/org/members/'),
  orgProfile: () => api.get('/users/org/profile/'),
  orgRemoveMember: (id) => api.delete(`/users/org/members/${id}/`),
  orgAddTokens: (id, data) => api.post(`/users/org/members/${id}/add-tokens/`, data),
  orgRemoveTokens: (id, data) => api.post(`/users/org/members/${id}/remove-tokens/`, data),
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

export const youtubeService = {
  translate: (youtubeUrl) => api.post('/translation/youtube-translate/', { youtube_url: youtubeUrl }),
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
  toggleAutoRenewal: () => api.post('/billing/toggle-auto-renewal/'),
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
// WEBSOCKET - Translation Stream
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

// =========================
// WEBSOCKET - Meeting
// =========================
let meetingWs = null;

export const meetingWsService = {
  connect: (meetingCode, onMessage) => {
    const token = localStorage.getItem('token');
    meetingWs = new WebSocket(`${WS_URL}/ws/meeting/${meetingCode}/?token=${token}`);

    meetingWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    return meetingWs;
  },
  send: (data) => {
    if (meetingWs?.readyState === WebSocket.OPEN) {
      meetingWs.send(JSON.stringify(data));
    }
  },
  sendBinary: (data) => {
    if (meetingWs?.readyState === WebSocket.OPEN) {
      meetingWs.send(data);
    }
  },
  disconnect: () => {
    meetingWs?.close();
    meetingWs = null;
  },
  getState: () => meetingWs?.readyState,
};

export default api;