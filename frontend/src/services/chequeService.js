import api from './api';

export const chequeService = {
  // Get all cheques with filters
  getAll: async (params = {}) => {
    const response = await api.get('/api/cheques', { params });
    return response.data;
  },

  // Get cheque by ID
  getById: async (id) => {
    const response = await api.get(`/api/cheques/${id}`);
    return response.data;
  },

  // Create new cheque
  create: async (data) => {
    const response = await api.post('/api/cheques', data);
    return response.data;
  },

  // Update cheque
  update: async (id, data) => {
    const response = await api.put(`/api/cheques/${id}`, data);
    return response.data;
  },

  // Update cheque status
  updateStatus: async (id, status, notes) => {
    const response = await api.patch(`/api/cheques/${id}/status`, { status, notes });
    return response.data;
  },

  // Delete cheque
  delete: async (id) => {
    const response = await api.delete(`/api/cheques/${id}`);
    return response.data;
  },

  // Get statistics
  getStatistics: async (params = {}) => {
    const response = await api.get('/api/cheques/statistics', { params });
    return response.data;
  },

  // Get due cheques
  getDueCheques: async (days = 7) => {
    const response = await api.get('/api/cheques/due', { params: { days } });
    return response.data;
  },
};
