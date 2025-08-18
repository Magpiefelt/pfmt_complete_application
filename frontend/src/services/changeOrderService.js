import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export const changeOrderService = {
  async getChangeOrders(params = {}) {
    try {
      const response = await api.get('/change-orders', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching change orders:', error);
      throw error;
    }
  },

  async getChangeOrder(id) {
    try {
      const response = await api.get(`/change-orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching change order:', error);
      throw error;
    }
  },

  async createChangeOrder(changeOrderData) {
    try {
      const response = await api.post('/change-orders', changeOrderData);
      return response.data;
    } catch (error) {
      console.error('Error creating change order:', error);
      throw error;
    }
  },

  async updateChangeOrder(id, changeOrderData) {
    try {
      const response = await api.put(`/change-orders/${id}`, changeOrderData);
      return response.data;
    } catch (error) {
      console.error('Error updating change order:', error);
      throw error;
    }
  },

  async deleteChangeOrder(id) {
    try {
      const response = await api.delete(`/change-orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting change order:', error);
      throw error;
    }
  },

  async submitChangeOrder(id) {
    try {
      const response = await api.post(`/change-orders/${id}/submit`);
      return response.data;
    } catch (error) {
      console.error('Error submitting change order:', error);
      throw error;
    }
  },

  async approveChangeOrder(id, approvalData) {
    try {
      const response = await api.post(`/change-orders/${id}/approve`, approvalData);
      return response.data;
    } catch (error) {
      console.error('Error approving change order:', error);
      throw error;
    }
  },

  async rejectChangeOrder(id, rejectionData) {
    try {
      const response = await api.post(`/change-orders/${id}/reject`, rejectionData);
      return response.data;
    } catch (error) {
      console.error('Error rejecting change order:', error);
      throw error;
    }
  },

  async implementChangeOrder(id, implementationData) {
    try {
      const response = await api.post(`/change-orders/${id}/implement`, implementationData);
      return response.data;
    } catch (error) {
      console.error('Error implementing change order:', error);
      throw error;
    }
  }
};

export default changeOrderService;
