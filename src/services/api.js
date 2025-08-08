import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('whatsapp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('whatsapp_token');
      localStorage.removeItem('whatsapp_user');
      window.location.href = '/login';
    }

    return Promise.reject({
      message: error.response?.data?.message || error.message || 'Something went wrong',
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

// Auth API methods
export const authAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  logout: () => api.post('/users/logout'),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (updates) => api.put('/users/profile', updates),
  getAllUsers: (params = {}) => api.get('/users/all', { params }),
};

// Messages API methods
export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId, params = {}) =>
    api.get(`/messages/conversation/${conversationId}`, { params }),
  sendMessage: (messageData) => api.post('/messages/send', messageData),
  updateMessageStatus: (messageId, status) =>
    api.put(`/messages/status/${messageId}`, { status }),
  deleteMessage: (messageId, deleteForEveryone = false) =>
    api.delete(`/messages/${messageId}`, { data: { deleteForEveryone } }),
  deleteConversation: (conversationId) =>
    api.delete(`/messages/conversation/${conversationId}`),
  clearConversation: (conversationId) =>
    api.delete(`/messages/conversation/${conversationId}/clear`),
  archiveConversation: (conversationId, archive = true) =>
    api.put(`/messages/conversation/${conversationId}/archive`, { archive }),
  unarchiveConversation: (conversationId) =>
    api.put(`/messages/conversation/${conversationId}/archive`, { archive: false }),
  getArchivedConversations: () => api.get('/messages/conversations/archived'),
  muteConversation: (conversationId, mute = true, duration = null) =>
    api.put(`/messages/conversation/${conversationId}/mute`, { mute, duration }),
  blockUser: (userId) => api.post('/messages/block', { userId }),
  unblockUser: (userId) => api.delete('/messages/block', { data: { userId } }),
  getBlockedUsers: () => api.get('/messages/blocked'),
  exportConversation: (conversationId) =>
    api.get(`/messages/conversation/${conversationId}/export`, { responseType: 'blob' }),
  searchMessages: (params) => api.get('/messages/search', { params }),
  forwardMessage: (messageId, toNumbers) =>
    api.post('/messages/forward', { messageId, toNumbers }),
  getMessageInfo: (messageId) => api.get(`/messages/info/${messageId}`),
};

// Payloads API methods
export const payloadsAPI = {
  loadPayloads: () => api.post('/payloads/load-payloads'),
  processPayloads: () => api.post('/payloads/process-payloads'),
  getPayloads: () => api.get('/payloads/payloads'),
  getProcessedMessages: () => api.get('/payloads/processed-messages'),
  getStats: () => api.get('/payloads/stats'),
  processSinglePayload: (payload) => api.post('/payloads/process-single', { payload }),
};

// Utility functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('whatsapp_token', token);
    api.defaults.headers.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem('whatsapp_token');
    delete api.defaults.headers.Authorization;
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('whatsapp_token');
};

export const clearAuth = () => {
  localStorage.removeItem('whatsapp_token');
  localStorage.removeItem('whatsapp_user');
  delete api.defaults.headers.Authorization;
};

export default api;
