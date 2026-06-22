import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const API_BASE = 'https://adsportalbackend.vercel.app/api';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dsp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== AUTH API =====

export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Store token
      localStorage.setItem('dsp_token', response.data.accessToken);
      localStorage.setItem('dsp_user', JSON.stringify({
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        company: response.data.company,
      }));
      
      return response;
    } catch (err) {
      throw err;
    }
  },

  register: async (data) => {
    try {
      const response = await api.post('/auth/register', data);
      return response;
    } catch (err) {
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('dsp_token');
    localStorage.removeItem('dsp_user');
  },

  verifyEmail: async (token) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      throw err;
    }
  },
};

// ===== CAMPAIGN API =====

export const campaignAPI = {
  list: () => api.get('/campaigns'),
  
  get: (id) => api.get(`/campaigns/${id}`),
  
  create: (data) => api.post('/campaigns', data),
  
  update: (id, data) => api.patch(`/campaigns/${id}`, data),
  
  delete: (id) => api.delete(`/campaigns/${id}`),
  
  analytics: (id, days = 7) => api.get(`/campaigns/${id}/analytics?days=${days}`),
};

// ===== AD API =====

export const adAPI = {
  list: (campaignId) => api.get(`/campaigns/${campaignId}/ads`),
  
  create: (campaignId, data) => api.post(`/campaigns/${campaignId}/ads`, data),
  
  update: (id, data) => api.patch(`/ads/${id}`, data),
};

// ===== PLACEMENT API =====

export const placementAPI = {
  list: () => api.get('/placements'),
};

// ===== AD SERVING API =====

export const adServingAPI = {
  serveAd: (placementId) => api.get(`/serve-ad?placement_id=${placementId}`),
  
  trackClick: (data) => api.post('/track-click', data),
};

export default api;
