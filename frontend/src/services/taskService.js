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

export const taskService = {
  async getTasks(params = {}) {
    try {
      const response = await api.get('/tasks', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  async getTask(id) {
    try {
      const response = await api.get(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error;
    }
  },

  async createTask(taskData) {
    try {
      const response = await api.post('/tasks', taskData);
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  async updateTask(id, taskData) {
    try {
      const response = await api.put(`/tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  async deleteTask(id) {
    try {
      const response = await api.delete(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  async startTask(id) {
    try {
      const response = await api.post(`/tasks/${id}/start`);
      return response.data;
    } catch (error) {
      console.error('Error starting task:', error);
      throw error;
    }
  },

  async completeTask(id, completionData) {
    try {
      const response = await api.post(`/tasks/${id}/complete`, completionData);
      return response.data;
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  },

  async assignTask(id, assignmentData) {
    try {
      const response = await api.post(`/tasks/${id}/assign`, assignmentData);
      return response.data;
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  },

  async holdTask(id, holdData) {
    try {
      const response = await api.post(`/tasks/${id}/hold`, holdData);
      return response.data;
    } catch (error) {
      console.error('Error putting task on hold:', error);
      throw error;
    }
  },

  async resumeTask(id) {
    try {
      const response = await api.post(`/tasks/${id}/resume`);
      return response.data;
    } catch (error) {
      console.error('Error resuming task:', error);
      throw error;
    }
  },

  async cancelTask(id, cancellationData) {
    try {
      const response = await api.post(`/tasks/${id}/cancel`, cancellationData);
      return response.data;
    } catch (error) {
      console.error('Error cancelling task:', error);
      throw error;
    }
  },

  async getTaskStatistics() {
    try {
      const response = await api.get('/tasks/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching task statistics:', error);
      throw error;
    }
  }
};

export default taskService;
