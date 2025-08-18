/**
 * Project Service
 * API service for project management operations
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
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const projectService = {
  /**
   * Get all projects with filtering and pagination
   */
  async getProjects(params = {}) {
    try {
      const response = await api.get('/projects', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  /**
   * Get project by ID
   */
  async getProject(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  },

  /**
   * Create new project
   */
  async createProject(projectData) {
    try {
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  /**
   * Update existing project
   */
  async updateProject(projectId, projectData) {
    try {
      const response = await api.put(`/projects/${projectId}`, projectData);
      return response.data;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  /**
   * Delete project
   */
  async deleteProject(projectId) {
    try {
      const response = await api.delete(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  /**
   * Get project statistics
   */
  async getProjectStatistics(params = {}) {
    try {
      const response = await api.get('/projects/statistics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching project statistics:', error);
      throw error;
    }
  },

  /**
   * Get project team members
   */
  async getProjectTeamMembers(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}/team-members`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project team members:', error);
      throw error;
    }
  },

  /**
   * Add team member to project
   */
  async addTeamMember(projectId, memberData) {
    try {
      const response = await api.post(`/projects/${projectId}/team-members`, memberData);
      return response.data;
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  },

  /**
   * Remove team member from project
   */
  async removeTeamMember(projectId, memberId) {
    try {
      const response = await api.delete(`/projects/${projectId}/team-members/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  },

  /**
   * Get project budget information
   */
  async getProjectBudget(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}/budget`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project budget:', error);
      throw error;
    }
  },

  /**
   * Update project budget
   */
  async updateProjectBudget(projectId, budgetData) {
    try {
      const response = await api.put(`/projects/${projectId}/budget`, budgetData);
      return response.data;
    } catch (error) {
      console.error('Error updating project budget:', error);
      throw error;
    }
  },

  /**
   * Get project timeline
   */
  async getProjectTimeline(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}/timeline`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project timeline:', error);
      throw error;
    }
  },

  /**
   * Get project tasks
   */
  async getProjectTasks(projectId, params = {}) {
    try {
      const response = await api.get(`/projects/${projectId}/tasks`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      throw error;
    }
  },

  /**
   * Get project reports
   */
  async getProjectReports(projectId, params = {}) {
    try {
      const response = await api.get(`/projects/${projectId}/reports`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching project reports:', error);
      throw error;
    }
  },

  /**
   * Get project gate meetings
   */
  async getProjectGateMeetings(projectId, params = {}) {
    try {
      const response = await api.get(`/projects/${projectId}/gate-meetings`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching project gate meetings:', error);
      throw error;
    }
  },

  /**
   * Get project contracts
   */
  async getProjectContracts(projectId, params = {}) {
    try {
      const response = await api.get(`/projects/${projectId}/contracts`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching project contracts:', error);
      throw error;
    }
  },

  /**
   * Export project data
   */
  async exportProject(projectId, format = 'pdf') {
    try {
      const response = await api.get(`/projects/${projectId}/export`, {
        params: { format },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project_${projectId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting project:', error);
      throw error;
    }
  }
};

export default projectService;

