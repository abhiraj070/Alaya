import { useState, useEffect, useCallback } from 'react';
import { getNodeDetail } from '../data/chunkDetail.js';

export function useChunkDetail(knowledgeId, isDemo = false, fallbackNode = null) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (knowledgeId == null) return;
    const controller = new AbortController();
    setResult({ id: knowledgeId, isDemo, loading: true });
    getNodeDetail(knowledgeId, isDemo, fallbackNode, { signal: controller.signal }).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ id: knowledgeId, isDemo, data });
      },
      (error) => {
        if (!controller.signal.aborted) {
          setResult({ id: knowledgeId, isDemo, error });
        }
      },
    );
    return () => controller.abort();
  }, [knowledgeId, isDemo, attempt, fallbackNode]);

  const current = knowledgeId != null && result?.id === knowledgeId && result.isDemo === isDemo ? result : null;
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return {
    chunkDetail: current?.data ?? null,
    loading: knowledgeId != null && (!current || Boolean(current.loading)),
    error: current?.error ?? null,
    retry,
  };
}
