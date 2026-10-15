import { useState, useEffect, useRef, useCallback } from 'react';
import { universeProvider } from '../data/universeProvider.js';

// Global in-memory cache across star selections within session
const chunkDetailCache = new Map();

/**
 * Custom hook to retrieve full chunk details for a selected star
 *
 * Implements:
 * - Routing through unified universeProvider (demo vs real)
 * - In-memory caching for zero-latency re-inspection
 * - Race-condition prevention (cancels stale responses)
 * - Safe error handling with retry capability
 *
 * @param {number|null} knowledgeId
 */
export function useChunkDetail(knowledgeId) {
  const [chunkDetail, setChunkDetail] = useState(() => {
    return knowledgeId !== null ? chunkDetailCache.get(knowledgeId) || null : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tracks active request sequence to discard stale responses
  const activeRequestIdRef = useRef(0);

  const fetchDetail = useCallback(
    async (id, forceRefresh = false) => {
      if (id === null || id === undefined) {
        setChunkDetail(null);
        setLoading(false);
        setError(null);
        return;
      }

      // Check cache first
      if (!forceRefresh && chunkDetailCache.has(id)) {
        setChunkDetail(chunkDetailCache.get(id));
        setLoading(false);
        setError(null);
        return;
      }

      const requestId = ++activeRequestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const data = await universeProvider.getChunk(id);

        // Ensure this response matches the most recently requested star
        if (requestId === activeRequestIdRef.current) {
          chunkDetailCache.set(id, data);
          setChunkDetail(data);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        if (requestId === activeRequestIdRef.current) {
          setLoading(false);
          setError({
            message: err.message || 'Failed to retrieve chunk details',
            status: err.status || 0,
            detail: err.detail || null,
          });
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchDetail(knowledgeId);
  }, [knowledgeId, fetchDetail]);

  const retry = useCallback(() => {
    if (knowledgeId !== null) {
      fetchDetail(knowledgeId, true);
    }
  }, [knowledgeId, fetchDetail]);

  return {
    chunkDetail,
    loading,
    error,
    retry,
  };
}

export default useChunkDetail;
