import { useState, useEffect, useCallback } from 'react';
import { universeApi } from '../api/universeApi.js';

export function useChunkDetail(knowledgeId) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (knowledgeId == null) return;
    const controller = new AbortController();
    setResult({ id: knowledgeId, loading: true });
    universeApi.getChunk(knowledgeId, { signal: controller.signal }).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ id: knowledgeId, data });
      },
      (error) => {
        if (!controller.signal.aborted) setResult({ id: knowledgeId, error });
      },
    );
    return () => controller.abort();
  }, [knowledgeId, attempt]);

  const current = knowledgeId != null && result?.id === knowledgeId ? result : null;
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return {
    chunkDetail: current?.data ?? null,
    loading: knowledgeId != null && (!current || Boolean(current.loading)),
    error: current?.error ?? null,
    retry,
  };
}
