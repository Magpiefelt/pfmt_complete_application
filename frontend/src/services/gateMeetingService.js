/**
 * Gate Meeting Service
 * API service for gate meeting operations
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
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

// Handle auth errors
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

export const gateMeetingService = {
  /**
   * Get all gate meetings with filtering and pagination
   */
  async getGateMeetings(params = {}) {
    try {
      const response = await api.get('/gate-meetings', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching gate meetings:', error);
      throw error;
    }
  },

  /**
   * Get gate meeting by ID
   */
  async getGateMeeting(id) {
    try {
      const response = await api.get(`/gate-meetings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching gate meeting:', error);
      throw error;
    }
  },

  /**
   * Create new gate meeting
   */
  async createGateMeeting(gateMeetingData) {
    try {
      const response = await api.post('/gate-meetings', gateMeetingData);
      return response.data;
    } catch (error) {
      console.error('Error creating gate meeting:', error);
      throw error;
    }
  },

  /**
   * Update gate meeting
   */
  async updateGateMeeting(id, gateMeetingData) {
    try {
      const response = await api.put(`/gate-meetings/${id}`, gateMeetingData);
      return response.data;
    } catch (error) {
      console.error('Error updating gate meeting:', error);
      throw error;
    }
  },

  /**
   * Delete gate meeting
   */
  async deleteGateMeeting(id) {
    try {
      const response = await api.delete(`/gate-meetings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting gate meeting:', error);
      throw error;
    }
  },

  /**
   * Start gate meeting
   */
  async startGateMeeting(id) {
    try {
      const response = await api.post(`/gate-meetings/${id}/start`);
      return response.data;
    } catch (error) {
      console.error('Error starting gate meeting:', error);
      throw error;
    }
  },

  /**
   * Complete gate meeting
   */
  async completeGateMeeting(id, completionData) {
    try {
      const response = await api.post(`/gate-meetings/${id}/complete`, completionData);
      return response.data;
    } catch (error) {
      console.error('Error completing gate meeting:', error);
      throw error;
    }
  },

  /**
   * Cancel gate meeting
   */
  async cancelGateMeeting(id, cancellationData) {
    try {
      const response = await api.post(`/gate-meetings/${id}/cancel`, cancellationData);
      return response.data;
    } catch (error) {
      console.error('Error cancelling gate meeting:', error);
      throw error;
    }
  },

  /**
   * Postpone gate meeting
   */
  async postponeGateMeeting(id, postponementData) {
    try {
      const response = await api.post(`/gate-meetings/${id}/postpone`, postponementData);
      return response.data;
    } catch (error) {
      console.error('Error postponing gate meeting:', error);
      throw error;
    }
  },

  /**
   * Get gate meeting statistics
   */
  async getGateMeetingStatistics() {
    try {
      const response = await api.get('/gate-meetings/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching gate meeting statistics:', error);
      throw error;
    }
  },

  /**
   * Get upcoming gate meetings
   */
  async getUpcomingGateMeetings(days = 30) {
    try {
      const response = await api.get('/gate-meetings/upcoming', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming gate meetings:', error);
      throw error;
    }
  },

  /**
   * Get gate meeting attendees
   */
  async getGateMeetingAttendees(id) {
    try {
      const response = await api.get(`/gate-meetings/${id}/attendees`);
      return response.data;
    } catch (error) {
      console.error('Error fetching gate meeting attendees:', error);
      throw error;
    }
  },

  /**
   * Add attendee to gate meeting
   */
  async addGateMeetingAttendee(id, attendeeData) {
    try {
      const response = await api.post(`/gate-meetings/${id}/attendees`, attendeeData);
      return response.data;
    } catch (error) {
      console.error('Error adding gate meeting attendee:', error);
      throw error;
    }
  },

  /**
   * Remove attendee from gate meeting
   */
  async removeGateMeetingAttendee(id, attendeeId) {
    try {
      const response = await api.delete(`/gate-meetings/${id}/attendees/${attendeeId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing gate meeting attendee:', error);
      throw error;
    }
  },

  /**
   * Get gate meeting action items
   */
  async getGateMeetingActionItems(id) {
    try {
      const response = await api.get(`/gate-meetings/${id}/action-items`);
      return response.data;
    } catch (error) {
      console.error('Error fetching gate meeting action items:', error);
      throw error;
    }
  },

  /**
   * Add action item to gate meeting
   */
  async addGateMeetingActionItem(id, actionItemData) {
    try {
      const response = await api.post(`/gate-meetings/${id}/action-items`, actionItemData);
      return response.data;
    } catch (error) {
      console.error('Error adding gate meeting action item:', error);
      throw error;
    }
  },

  /**
   * Update gate meeting action item
   */
  async updateGateMeetingActionItem(id, actionItemId, actionItemData) {
    try {
      const response = await api.put(`/gate-meetings/${id}/action-items/${actionItemId}`, actionItemData);
      return response.data;
    } catch (error) {
      console.error('Error updating gate meeting action item:', error);
      throw error;
    }
  },

  /**
   * Delete gate meeting action item
   */
  async deleteGateMeetingActionItem(id, actionItemId) {
    try {
      const response = await api.delete(`/gate-meetings/${id}/action-items/${actionItemId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting gate meeting action item:', error);
      throw error;
    }
  },

  /**
   * Export gate meeting to PDF
   */
  async exportGateMeeting(id, format = 'pdf') {
    try {
      const response = await api.get(`/gate-meetings/${id}/export`, {
        params: { format },
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gate-meeting-${id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response.data;
    } catch (error) {
      console.error('Error exporting gate meeting:', error);
      throw error;
    }
  },

  /**
   * Search gate meetings
   */
  async searchGateMeetings(searchTerm, filters = {}) {
    try {
      const params = {
        search: searchTerm,
        ...filters
      };
      const response = await api.get('/gate-meetings', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching gate meetings:', error);
      throw error;
    }
  },

  /**
   * Get gate meetings by project
   */
  async getGateMeetingsByProject(projectId, params = {}) {
    try {
      const response = await api.get('/gate-meetings', {
        params: {
          project: projectId,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching gate meetings by project:', error);
      throw error;
    }
  },

  /**
   * Get gate meetings by status
   */
  async getGateMeetingsByStatus(status, params = {}) {
    try {
      const response = await api.get('/gate-meetings', {
        params: {
          status,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching gate meetings by status:', error);
      throw error;
    }
  },

  /**
   * Get gate meetings by gate type
   */
  async getGateMeetingsByType(gateType, params = {}) {
    try {
      const response = await api.get('/gate-meetings', {
        params: {
          gate_type: gateType,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching gate meetings by type:', error);
      throw error;
    }
  },

  /**
   * Get gate meeting templates
   */
  async getGateMeetingTemplates() {
    try {
      // This would typically come from a templates endpoint
      // For now, return predefined templates
      return {
        templates: [
          {
            id: 'gate-0',
            name: 'Gate 0 - Concept',
            description: 'Initial concept review and approval',
            agenda_template: `1. Project Overview\n2. Business Case\n3. Initial Requirements\n4. Risk Assessment\n5. Go/No-Go Decision`
          },
          {
            id: 'gate-1',
            name: 'Gate 1 - Feasibility',
            description: 'Feasibility study review',
            agenda_template: `1. Feasibility Study Results\n2. Technical Analysis\n3. Cost-Benefit Analysis\n4. Resource Requirements\n5. Approval Decision`
          },
          {
            id: 'gate-2',
            name: 'Gate 2 - Definition',
            description: 'Project definition and planning',
            agenda_template: `1. Project Charter\n2. Detailed Requirements\n3. Project Plan\n4. Budget Approval\n5. Team Assignment`
          },
          {
            id: 'gate-3',
            name: 'Gate 3 - Implementation',
            description: 'Implementation readiness review',
            agenda_template: `1. Implementation Plan\n2. Resource Allocation\n3. Risk Mitigation\n4. Quality Assurance\n5. Go-Live Approval`
          },
          {
            id: 'gate-4',
            name: 'Gate 4 - Handover',
            description: 'Project handover and closure',
            agenda_template: `1. Deliverables Review\n2. Acceptance Criteria\n3. Handover Documentation\n4. Support Transition\n5. Project Closure`
          },
          {
            id: 'gate-5',
            name: 'Gate 5 - Benefits',
            description: 'Benefits realization review',
            agenda_template: `1. Benefits Assessment\n2. Performance Metrics\n3. Lessons Learned\n4. Continuous Improvement\n5. Final Sign-off`
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching gate meeting templates:', error);
      throw error;
    }
  }
};

export default gateMeetingService;

