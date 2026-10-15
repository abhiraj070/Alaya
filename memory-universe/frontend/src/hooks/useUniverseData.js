/**
 * Alaya Memory Universe — useUniverseData Hook
 *
 * Custom React hook subscribing to the universe state store and exposing
 * data, mode flags (real vs demo), disclaimer controls, search, and camera navigation triggers.
 */

import { useEffect, useSyncExternalStore, useCallback } from 'react';
import {
  getState,
  subscribe,
  fetchUniverseNodes,
  triggerRecompute,
  selectStar,
  clearSelection,
  setSearchQuery,
  setFacetFilter,
  clearAllFilters,
  navigateToStar,
  enterDemoMode,
  exitDemoMode,
  dismissDisclaimer,
} from '../store/universeStore.js';

export function useUniverseData({ autoFetch = true } = {}) {
  // Subscribe to external store with React's native useSyncExternalStore
  const storeState = useSyncExternalStore(subscribe, getState, getState);

  // Initial data loading on mount
  useEffect(() => {
    if (autoFetch && storeState.nodes.length === 0 && !storeState.error && !storeState.isDemo) {
      fetchUniverseNodes().catch(() => {
        // Error is captured in storeState.error
      });
    }
  }, [autoFetch, storeState.nodes.length, storeState.error, storeState.isDemo]);

  const refresh = useCallback(() => {
    return fetchUniverseNodes();
  }, []);

  const recompute = useCallback(() => {
    return triggerRecompute();
  }, []);

  return {
    ...storeState,
    refresh,
    recompute,
    selectStar,
    clearSelection,
    setSearchQuery,
    setFacetFilter,
    clearAllFilters,
    navigateToStar,
    enterDemoMode,
    exitDemoMode,
    dismissDisclaimer,
  };
}

export default useUniverseData;
