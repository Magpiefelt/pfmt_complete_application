/**
 * Report Service
 * API service for report management operations
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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

export const reportService = {
  /**
   * Get all reports with filtering and pagination
   */
  async getReports(params = {}) {
    try {
      const response = await api.get('/team-a-reports', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },

  /**
   * Get report by ID
   */
  async getReport(reportId) {
    try {
      const response = await api.get(`/team-a-reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  },

  /**
   * Create new report
   */
  async createReport(reportData) {
    try {
      const response = await api.post('/team-a-reports', reportData);
      return response.data;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  },

  /**
   * Update existing report
   */
  async updateReport(reportId, reportData) {
    try {
      const response = await api.put(`/team-a-reports/${reportId}`, reportData);
      return response.data;
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  },

  /**
   * Delete report
   */
  async deleteReport(reportId) {
    try {
      const response = await api.delete(`/team-a-reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  },

  /**
   * Submit report for approval
   */
  async submitReport(reportId) {
    try {
      const response = await api.post(`/team-a-reports/${reportId}/submit`);
      return response.data;
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error;
    }
  },

  /**
   * Approve report
   */
  async approveReport(reportId, approvalData = {}) {
    try {
      const response = await api.post(`/team-a-reports/${reportId}/approve`, approvalData);
      return response.data;
    } catch (error) {
      console.error('Error approving report:', error);
      throw error;
    }
  },

  /**
   * Reject report
   */
  async rejectReport(reportId, rejectionData = {}) {
    try {
      const response = await api.post(`/team-a-reports/${reportId}/reject`, rejectionData);
      return response.data;
    } catch (error) {
      console.error('Error rejecting report:', error);
      throw error;
    }
  },

  /**
   * Get reports by project
   */
  async getReportsByProject(projectId, params = {}) {
    try {
      const response = await api.get(`/projects/${projectId}/team-a-reports`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching project reports:', error);
      throw error;
    }
  },

  /**
   * Get report statistics
   */
  async getReportStatistics(params = {}) {
    try {
      const response = await api.get('/team-a-reports/statistics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching report statistics:', error);
      throw error;
    }
  },

  /**
   * Export reports to PDF
   */
  async exportReport(reportId, format = 'pdf') {
    try {
      const response = await api.get(`/team-a-reports/${reportId}/export`, {
        params: { format },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  },

  /**
   * Export multiple reports to CSV
   */
  async exportReports(params = {}) {
    try {
      const response = await api.get('/team-a-reports/export', {
        params,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reports_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting reports:', error);
      throw error;
    }
  },

  /**
   * Upload report attachment
   */
  async uploadReportAttachment(reportId, file, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));
      
      const response = await api.post(`/team-a-reports/${reportId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading report attachment:', error);
      throw error;
    }
  },

  /**
   * Get report attachments
   */
  async getReportAttachments(reportId) {
    try {
      const response = await api.get(`/team-a-reports/${reportId}/attachments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report attachments:', error);
      throw error;
    }
  },

  /**
   * Delete report attachment
   */
  async deleteReportAttachment(reportId, attachmentId) {
    try {
      const response = await api.delete(`/team-a-reports/${reportId}/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting report attachment:', error);
      throw error;
    }
  },

  /**
   * Generate report template
   */
  async generateReportTemplate(templateType, projectId) {
    try {
      const response = await api.post('/team-a-reports/generate-template', {
        template_type: templateType,
        project_id: projectId
      });
      return response.data;
    } catch (error) {
      console.error('Error generating report template:', error);
      throw error;
    }
  },

  /**
   * Get report templates
   */
  async getReportTemplates() {
    try {
      const response = await api.get('/team-a-reports/templates');
      return response.data;
    } catch (error) {
      console.error('Error fetching report templates:', error);
      throw error;
    }
  }
};

export default reportService;

