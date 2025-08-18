/**
 * Contract Service
 * API service for contract management operations
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
      // Handle unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const contractService = {
  /**
   * Get all contracts with filtering and pagination
   */
  async getContracts(params = {}) {
    try {
      const response = await api.get('/contracts', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }
  },

  /**
   * Get contract by ID
   */
  async getContract(contractId) {
    try {
      const response = await api.get(`/contracts/${contractId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching contract:', error);
      throw error;
    }
  },

  /**
   * Create new contract
   */
  async createContract(contractData) {
    try {
      const response = await api.post('/contracts', contractData);
      return response.data;
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  },

  /**
   * Update existing contract
   */
  async updateContract(contractId, contractData) {
    try {
      const response = await api.put(`/contracts/${contractId}`, contractData);
      return response.data;
    } catch (error) {
      console.error('Error updating contract:', error);
      throw error;
    }
  },

  /**
   * Delete contract
   */
  async deleteContract(contractId) {
    try {
      const response = await api.delete(`/contracts/${contractId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting contract:', error);
      throw error;
    }
  },

  /**
   * Submit contract for approval
   */
  async submitContract(contractId) {
    try {
      const response = await api.post(`/contracts/${contractId}/submit`);
      return response.data;
    } catch (error) {
      console.error('Error submitting contract:', error);
      throw error;
    }
  },

  /**
   * Approve contract
   */
  async approveContract(contractId, approvalData = {}) {
    try {
      const response = await api.post(`/contracts/${contractId}/approve`, approvalData);
      return response.data;
    } catch (error) {
      console.error('Error approving contract:', error);
      throw error;
    }
  },

  /**
   * Reject contract
   */
  async rejectContract(contractId, rejectionData = {}) {
    try {
      const response = await api.post(`/contracts/${contractId}/reject`, rejectionData);
      return response.data;
    } catch (error) {
      console.error('Error rejecting contract:', error);
      throw error;
    }
  },

  /**
   * Get contracts by project
   */
  async getContractsByProject(projectId, params = {}) {
    try {
      const response = await api.get(`/projects/${projectId}/contracts`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching project contracts:', error);
      throw error;
    }
  },

  /**
   * Get contracts by vendor
   */
  async getContractsByVendor(vendorId, params = {}) {
    try {
      const response = await api.get(`/vendors/${vendorId}/contracts`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor contracts:', error);
      throw error;
    }
  },

  /**
   * Get contract statistics
   */
  async getContractStatistics(params = {}) {
    try {
      const response = await api.get('/contracts/statistics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching contract statistics:', error);
      throw error;
    }
  },

  /**
   * Export contracts to CSV
   */
  async exportContracts(params = {}) {
    try {
      const response = await api.get('/contracts/export', {
        params,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contracts_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting contracts:', error);
      throw error;
    }
  },

  /**
   * Upload contract document
   */
  async uploadContractDocument(contractId, file, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));
      
      const response = await api.post(`/contracts/${contractId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading contract document:', error);
      throw error;
    }
  },

  /**
   * Get contract documents
   */
  async getContractDocuments(contractId) {
    try {
      const response = await api.get(`/contracts/${contractId}/documents`);
      return response.data;
    } catch (error) {
      console.error('Error fetching contract documents:', error);
      throw error;
    }
  },

  /**
   * Delete contract document
   */
  async deleteContractDocument(contractId, documentId) {
    try {
      const response = await api.delete(`/contracts/${contractId}/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting contract document:', error);
      throw error;
    }
  },

  /**
   * Get contract change orders
   */
  async getContractChangeOrders(contractId, params = {}) {
    try {
      const response = await api.get(`/contracts/${contractId}/change-orders`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching contract change orders:', error);
      throw error;
    }
  },

  /**
   * Create contract change order
   */
  async createContractChangeOrder(contractId, changeOrderData) {
    try {
      const response = await api.post(`/contracts/${contractId}/change-orders`, changeOrderData);
      return response.data;
    } catch (error) {
      console.error('Error creating contract change order:', error);
      throw error;
    }
  }
};

export default contractService;

