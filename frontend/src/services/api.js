import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Add advertiser ID to all requests
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('dsp_user');
  if (user) {
    const { id } = JSON.parse(user);
    config.headers['x-advertiser-id'] = id;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
};

export const campaignAPI = {
  list: () => api.get('/campaigns'),
  get: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.patch(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
  analytics: (id, days = 7) => api.get(`/campaigns/${id}/analytics?days=${days}`),
};

export const adAPI = {
  list: (campaignId) => api.get(`/campaigns/${campaignId}/ads`),
  create: (campaignId, data) => api.post(`/campaigns/${campaignId}/ads`, data),
  update: (id, data) => api.patch(`/ads/${id}`, data),
};

export const placementAPI = {
  list: () => api.get('/placements'),
};

export const adServingAPI = {
  serveAd: (placementId) => api.get(`/serve-ad?placement_id=${placementId}`),
  trackClick: (data) => api.post('/track-click', data),
};

export default api;
