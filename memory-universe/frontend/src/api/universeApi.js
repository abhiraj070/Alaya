/**
 * Alaya Memory Universe — Universe API Service
 */

import { apiClient } from './client.js';

export const universeApi = {
  getUploads(options = {}) {
    return apiClient('/api/universe/uploads', { ...options, cache: 'no-store' });
  },
};
