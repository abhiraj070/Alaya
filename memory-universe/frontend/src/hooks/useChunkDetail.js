import { useState, useEffect, useCallback } from 'react';
import { universeApi } from '../api/universeApi.js';
import { demoUniverse } from '../data/demoUniverse.js';

export function useChunkDetail(knowledgeId, isDemo = false) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (knowledgeId == null) return;
    const controller = new AbortController();
    setResult({ id: knowledgeId, isDemo, loading: true });
    const provider = isDemo ? demoUniverse : universeApi;
    provider.getChunk(knowledgeId, { signal: controller.signal }).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ id: knowledgeId, isDemo, data });
      },
      (error) => {
        if (!controller.signal.aborted) setResult({ id: knowledgeId, isDemo, error });
      },
    );
    return () => controller.abort();
  }, [knowledgeId, isDemo, attempt]);

  const current = knowledgeId != null && result?.id === knowledgeId && result.isDemo === isDemo ? result : null;
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return {
    chunkDetail: current?.data ?? null,
    loading: knowledgeId != null && (!current || Boolean(current.loading)),
    error: current?.error ?? null,
    retry,
  };
}
