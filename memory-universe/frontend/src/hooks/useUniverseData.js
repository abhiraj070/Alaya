import { useEffect, useSyncExternalStore, useCallback, useRef, useState } from 'react';
import { universeApi } from '../api/universeApi.js';
import {
  getState, subscribe, applyUniverseSnapshot,
  selectStar, clearSelection, setFacetFilter, clearAllFilters, navigateToStar,
} from '../store/universeStore.js';

// REST lifecycle lives here; the store and 3D components have no network dependency.
export function useUniverseData() {
  const snapshot = useSyncExternalStore(subscribe, getState, getState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recomputing, setRecomputing] = useState(false);
  const nodesRequest = useRef(null);
  const projectionRequest = useRef(null);

  const refresh = useCallback(async () => {
    nodesRequest.current?.abort();
    const controller = new AbortController();
    nodesRequest.current = controller;
    setLoading(true);
    setError(null);
    try {
      const data = await universeApi.getNodes({ signal: controller.signal });
      if (!controller.signal.aborted) applyUniverseSnapshot(data);
    } catch (err) {
      if (!controller.signal.aborted) setError(err);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const recompute = useCallback(async () => {
    if (projectionRequest.current) return;
    const controller = new AbortController();
    projectionRequest.current = controller;
    setRecomputing(true);
    setError(null);
    try {
      await universeApi.recomputeCoordinates({ signal: controller.signal });
      // The endpoint returns after committing coordinates; no timer or polling needed.
      if (!controller.signal.aborted) await refresh();
    } catch (err) {
      if (!controller.signal.aborted) setError(err);
    } finally {
      if (projectionRequest.current === controller) projectionRequest.current = null;
      if (!controller.signal.aborted) setRecomputing(false);
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    return () => {
      nodesRequest.current?.abort();
      projectionRequest.current?.abort();
      projectionRequest.current = null;
    };
  }, [refresh]);

  return {
    ...snapshot, loading, error, recomputing, refresh, recompute,
    selectStar, clearSelection, setFacetFilter, clearAllFilters, navigateToStar,
  };
}
