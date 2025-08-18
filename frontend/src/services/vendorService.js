/**
 * Vendor Service
 * API service for vendor management operations
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const vendorService = {
  /**
   * Get all vendors with filtering and pagination
   */
  async getVendors(params = {}) {
    try {
      const response = await api.get('/vendors', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  },

  /**
   * Get vendor by ID
   */
  async getVendor(vendorId) {
    try {
      const response = await api.get(`/vendors/${vendorId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor:', error);
      throw error;
    }
  },

  /**
   * Create new vendor
   */
  async createVendor(vendorData) {
    try {
      const response = await api.post('/vendors', vendorData);
      return response.data;
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }
  },

  /**
   * Update existing vendor
   */
  async updateVendor(vendorId, vendorData) {
    try {
      const response = await api.put(`/vendors/${vendorId}`, vendorData);
      return response.data;
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
  },

  /**
   * Delete vendor
   */
  async deleteVendor(vendorId) {
    try {
      const response = await api.delete(`/vendors/${vendorId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }
  },

  /**
   * Rate vendor
   */
  async rateVendor(vendorId, ratingData) {
    try {
      const response = await api.post(`/vendors/${vendorId}/rate`, ratingData);
      return response.data;
    } catch (error) {
      console.error('Error rating vendor:', error);
      throw error;
    }
  },

  /**
   * Get vendor ratings
   */
  async getVendorRatings(vendorId, params = {}) {
    try {
      const response = await api.get(`/vendors/${vendorId}/ratings`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor ratings:', error);
      throw error;
    }
  },

  /**
   * Get vendor contracts
   */
  async getVendorContracts(vendorId, params = {}) {
    try {
      const response = await api.get(`/vendors/${vendorId}/contracts`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor contracts:', error);
      throw error;
    }
  },

  /**
   * Get vendor performance metrics
   */
  async getVendorPerformance(vendorId) {
    try {
      const response = await api.get(`/vendors/${vendorId}/performance`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor performance:', error);
      throw error;
    }
  },

  /**
   * Search vendors by capabilities
   */
  async searchVendorsByCapabilities(capabilities, params = {}) {
    try {
      const response = await api.post('/vendors/search/capabilities', {
        capabilities,
        ...params
      });
      return response.data;
    } catch (error) {
      console.error('Error searching vendors by capabilities:', error);
      throw error;
    }
  },

  /**
   * Get vendor statistics
   */
  async getVendorStatistics(params = {}) {
    try {
      const response = await api.get('/vendors/statistics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor statistics:', error);
      throw error;
    }
  },

  /**
   * Export vendors to CSV
   */
  async exportVendors(params = {}) {
    try {
      const response = await api.get('/vendors/export', {
        params,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vendors_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting vendors:', error);
      throw error;
    }
  }
};

export default vendorService;

