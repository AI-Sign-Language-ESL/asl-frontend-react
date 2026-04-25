import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
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

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendCode: (email) => api.post('/auth/resend-code', { email }),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  me: () => api.get('/auth/me'),
};

export const userService = {
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/password', data),
  deleteAccount: () => api.delete('/users/account'),
};

export const translatorService = {
  translate: (videoBlob) => {
    const formData = new FormData();
    formData.append('video', videoBlob);
    return api.post('/translator/detect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getHistory: (page = 1) => api.get(`/translator/history?page=${page}`),
};

export const generatorService = {
  generate: (text) => api.post('/generator/text-to-sign', { text }),
  getSupportedPhrases: () => api.get('/generator/supported-phrases'),
};

export const datasetService = {
  upload: (formData) => api.post('/dataset/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyContributions: () => api.get('/dataset/my-contributions'),
  deleteContribution: (id) => api.delete(`/dataset/contribution/${id}`),
};

export const settingsService = {
  getPreferences: () => api.get('/settings/preferences'),
  updatePreferences: (data) => api.put('/settings/preferences', data),
};

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

export const notificationService = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const billingService = {
  getSubscription: () => api.get('/billing/subscription'),
  getInvoices: () => api.get('/billing/invoices'),
  subscribe: (planId) => api.post('/billing/subscribe', { planId }),
  cancel: () => api.delete('/billing/subscription'),
  updatePaymentMethod: (data) => api.put('/billing/payment-method', data),
};

export default api;