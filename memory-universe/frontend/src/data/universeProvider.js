/**
 * Alaya Memory Universe — Shared Universe Data Provider
 *
 * Implements one unified data interface supporting two distinct modes:
 * - 'real': Queries the authenticated FastAPI backend and PostgreSQL database
 * - 'demo': Queries the local curated 84-star deterministic demo dataset
 *
 * Guarantees strict identifier separation:
 * - Demo IDs (90000+) are NEVER dispatched to the real backend.
 * - Real database IDs are NEVER looked up in the demo dataset.
 */

import { universeApi } from '../api/universeApi.js';
import { DEMO_NODES, DEMO_CHUNKS_MAP, DEMO_TOTAL_STARS, isDemoId } from './demoDataset.js';

export { isDemoId };

let activeMode = 'real'; // 'real' | 'demo'

export function getActiveMode() {
  return activeMode;
}

export function setActiveMode(mode) {
  if (mode !== 'real' && mode !== 'demo') {
    throw new Error(`Invalid universe mode: ${mode}`);
  }
  activeMode = mode;
}

export const universeProvider = {
  getMode() {
    return activeMode;
  },

  setMode(mode) {
    setActiveMode(mode);
  },

  isDemoMode() {
    return activeMode === 'demo';
  },

  /**
   * Retrieve nodes for the active mode
   */
  async getNodes() {
    if (activeMode === 'demo') {
      return {
        total_stars: DEMO_TOTAL_STARS,
        is_projected: true,
        unprojected_count: 0,
        nodes: DEMO_NODES,
        is_demo: true,
      };
    }

    // Real mode: query backend
    return universeApi.getNodes();
  },

  /**
   * Fetch full chunk details by ID with strict identifier isolation
   */
  async getChunk(knowledgeId) {
    if (knowledgeId === null || knowledgeId === undefined) {
      throw new Error('Knowledge ID is required');
    }

    // If ID belongs to demo range, strictly resolve locally
    if (isDemoId(knowledgeId)) {
      const demoChunk = DEMO_CHUNKS_MAP.get(knowledgeId);
      if (!demoChunk) {
        throw new Error(`Demo knowledge chunk #${knowledgeId} not found`);
      }
      return demoChunk;
    }

    // In demo mode with non-demo ID: reject safely without backend hit
    if (activeMode === 'demo') {
      throw new Error('Cannot query real knowledge IDs while in demo mode');
    }

    // Real mode: query backend API
    return universeApi.getChunk(knowledgeId);
  },

  /**
   * Trigger UMAP recomputation
   */
  async recomputeCoordinates() {
    if (activeMode === 'demo') {
      return {
        message: 'Demo mode uses precomputed coordinates.',
        status: 'accepted',
        job_id: null,
      };
    }

    return universeApi.recomputeCoordinates();
  },

  /**
   * Provide sample document text for demo source viewing
   */
  getDemoSourceDocument(sourceName, pageNumber = 1) {
    return {
      sourceName,
      pageNumber: pageNumber || 1,
      totalPages: 14,
      docType: sourceName.endsWith('.pdf') ? 'PDF Document' : 'DOCX Document',
      excerpt: `[Sample Document Preview: ${sourceName} — Page ${pageNumber || 1}]\n\nThis is a functional demonstration preview of "${sourceName}". In production, clicking this button opens your uploaded document on Cloudinary with standard browser-native page navigation (#page=${pageNumber || 1}).\n\nAll extracted knowledge chunks retain their verified lineage to this document, allowing continuous round-trip navigation from 3D celestial stars back to the exact paragraph of your source materials.`,
    };
  },
};

export default universeProvider;
