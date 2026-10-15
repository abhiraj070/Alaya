/**
 * Alaya Memory Universe — Universe API Service
 */

import { apiClient } from './client.js';

export const universeApi = {
  getUploads(options = {}) {
    return apiClient('/api/universe/uploads', { ...options, cache: 'no-store' });
  },

  getNodes(options = {}) {
    return apiClient('/api/universe/nodes', options);
  },

  async getChunk(knowledgeId, options = {}) {
    if (!knowledgeId && knowledgeId !== 0) {
      throw new Error('Knowledge ID is required');
    }
    return apiClient(`/api/universe/chunks/${knowledgeId}`, options);
  },

  recomputeCoordinates(options = {}) {
    return apiClient('/api/universe/recompute', { ...options, method: 'POST' });
  },
};
