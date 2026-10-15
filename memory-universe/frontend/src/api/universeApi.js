/**
 * Alaya Memory Universe — Dedicated Universe API Service
 *
 * Centralizes all communication with the FastAPI `/api/universe` endpoints.
 * Maps 1:1 with the Phase 3 backend implementation.
 */

import { apiClient } from './client.js';

export const universeApi = {
  /**
   * Retrieve all 3D star coordinates and summary nodes for the authenticated user.
   *
   * @returns {Promise<{
   *   total_stars: number,
   *   is_projected: boolean,
   *   unprojected_count: number,
   *   nodes: Array<{
   *     id: number,
   *     x: number,
   *     y: number,
   *     z: number,
   *     title: string,
   *     preview: string,
   *     knowledge_type: string,
   *     cluster_id: number | null,
   *     cluster_name: string | null,
   *     source_type: string,
   *     source_name: string | null,
   *     has_source: boolean,
   *     created_at: string
   *   }>
   * }>}
   */
  async getNodes() {
    return apiClient('/api/universe/nodes', {
      method: 'GET',
    });
  },

  /**
   * Fetch complete chunk text, JSONB metadata, chunk position, and source file info
   * for a specific star.
   *
   * @param {number} knowledgeId - ID of the knowledge chunk to inspect
   * @returns {Promise<{
   *   id: number,
   *   text_content: string,
   *   knowledge_type: string,
   *   metadata: Record<string, any>,
   *   chunk_index: number | null,
   *   page_number: number | null,
   *   created_at: string,
   *   source: {
   *     id: number,
   *     data_type: string,
   *     tag: string | null,
   *     data_source: string,
   *     created_at: string
   *   } | null
   * }>}
   */
  async getChunk(knowledgeId) {
    if (!knowledgeId && knowledgeId !== 0) {
      throw new Error('Knowledge ID is required to fetch chunk details');
    }
    return apiClient(`/api/universe/chunk/${knowledgeId}`, {
      method: 'GET',
    });
  },

  /**
   * Trigger an asynchronous UMAP recalculation of 3D coordinates.
   * Debounced by the backend using a Redis lock.
   *
   * @returns {Promise<{
   *   message: string,
   *   status: 'accepted' | 'in_progress',
   *   job_id: string | null
   * }>}
   */
  async recomputeCoordinates() {
    return apiClient('/api/universe/recompute', {
      method: 'POST',
    });
  },
};

export default universeApi;
