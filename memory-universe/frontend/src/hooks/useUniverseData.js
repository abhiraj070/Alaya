import { useEffect, useSyncExternalStore, useCallback, useRef, useState } from 'react';
import { universeApi } from '../api/universeApi.js';
import { demoUniverse } from '../data/demoUniverse.js';
import {
  getState, subscribe, applyUniverseSnapshot,
  selectStar, clearSelection, setFacetFilter, clearAllFilters, navigateToStar, resetStore,
  setUploadedData,
} from '../store/universeStore.js';

// REST lifecycle lives here; the store and 3D components have no network dependency.
export function useUniverseData() {
  const snapshot = useSyncExternalStore(subscribe, getState, getState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [demoNotice, setDemoNotice] = useState(null);
  const disclaimerOffered = useRef(false);
  const nodesRequest = useRef(null);

  const refresh = useCallback(async (allowDemo = true) => {
    nodesRequest.current?.abort();
    const controller = new AbortController();
    nodesRequest.current = controller;
    setLoading(true);
    setError(null);
    setDemoNotice(null);
    setShowDisclaimer(false);
    try {
      const uploads = await universeApi.getUploads({ signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!Array.isArray(uploads)) throw new Error('Invalid upload response from the Alaya backend.');
      if (uploads.length > 0) {
        setUploadedData(uploads);
      } else if (allowDemo !== false || getState().isDemo) {
        applyUniverseSnapshot(demoUniverse.getNodes(), { isDemo: true });
        setDemoNotice('Your real universe is still empty. You are exploring sample data.');
        if (!disclaimerOffered.current) {
          disclaimerOffered.current = true;
          setShowDisclaimer(true);
        }
      } else {
        setUploadedData([]);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        // Authentication and network errors never count as an empty database.
        resetStore();
        setError(err);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const enterDemoMode = useCallback(() => {
    disclaimerOffered.current = true;
    // Recheck: an upload may have arrived while the introduction was open.
    return refresh(true);
  }, [refresh]);

  const exitDemoMode = useCallback(() => {
    resetStore();
    setShowDisclaimer(false);
    refresh(false);
  }, [refresh]);

  const exploreDemo = useCallback(() => {
    disclaimerOffered.current = false;
    return refresh();
  }, [refresh]);
  const dismissDisclaimer = useCallback(() => setShowDisclaimer(false), []);

  useEffect(() => {
    refresh();
    return () => {
      nodesRequest.current?.abort();
    };
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  return {
    ...snapshot, loading, error, refresh,
    showDisclaimer, demoNotice, exploreDemo, enterDemoMode, exitDemoMode, dismissDisclaimer,
    selectStar, clearSelection, setFacetFilter, clearAllFilters, navigateToStar,
  };
}
