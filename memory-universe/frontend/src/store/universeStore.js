/**
 * Alaya Memory Universe — State Store
 *
 * Unified state store managing universe nodes, projection status,
 * dual data provider modes (Real vs Demo), multi-faceted filtering,
 * search queries, and camera navigation targets.
 */

import { universeApi } from '../api/universeApi.js';
import { universeProvider } from '../data/universeProvider.js';
import { DEMO_NODES, DEMO_TOTAL_STARS } from '../data/demoDataset.js';

// Session-level flag indicating whether the user opted into demo exploration
let demoAcceptedInSession = false;

// Initial default state
const initialState = {
  // Mode & Demonstration flags
  mode: 'real', // 'real' | 'demo'
  isDemo: false,
  showDisclaimer: false,

  // Data
  nodes: [],
  totalStars: 0,
  isProjected: false,
  unprojectedCount: 0,
  lastUpdated: null,

  // Status flags
  loading: true,
  error: null, // { message: string, status?: number, detail?: any }
  recomputing: false,
  recomputeStatus: null, // { message: string, status: string }

  // Selection & Navigation
  selectedStarId: null,
  navigationTarget: null, // { x: number, y: number, z: number, starId: number, timestamp: number } | null

  // Search & Multifaceted Filters
  searchQuery: '',
  filters: {
    source: 'all',
    cluster: 'all',
    knowledgeType: 'all',
  },
};

let state = { ...initialState };
const listeners = new Set();

/**
 * Get current snapshot of store state
 */
export function getState() {
  return state;
}

/**
 * Update store state and notify subscribers
 */
export function setState(partial) {
  const next = typeof partial === 'function' ? partial(state) : partial;
  state = { ...state, ...next };
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (err) {
      console.error('[UniverseStore] Listener error:', err);
    }
  });
}

/**
 * Subscribe to state changes
 */
export function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Fetch universe nodes with automatic mode resolution & transition
 *
 * Rules:
 * 1. Checks backend for real user knowledge.
 * 2. If real nodes exist and are projected -> AUTOMATICALLY sets/transitions to REAL MODE.
 * 3. If user has 0 knowledge chunks -> checks if demo was accepted; if not, triggers disclaimer modal.
 * 4. Stale demo requests never overwrite real state.
 */
export async function fetchUniverseNodes() {
  setState({ loading: true, error: null });

  try {
    const realData = await universeApi.getNodes();
    const hasRealKnowledge = realData.total_stars > 0;
    const isRealProjected = realData.is_projected;

    // SCENARIO 1: Real knowledge exists and is projected -> Authoritative Real Mode
    if (hasRealKnowledge && isRealProjected) {
      universeProvider.setMode('real');
      setState({
        mode: 'real',
        isDemo: false,
        showDisclaimer: false,
        nodes: realData.nodes || [],
        totalStars: realData.total_stars,
        isProjected: true,
        unprojectedCount: realData.unprojected_count ?? 0,
        lastUpdated: new Date().toISOString(),
        loading: false,
        error: null,
        // Clear any lingering demo selections or filters
        selectedStarId: null,
        navigationTarget: null,
        filters: { source: 'all', cluster: 'all', knowledgeType: 'all' },
      });
      return realData;
    }

    // SCENARIO 2: Real knowledge exists but projection is pending
    if (hasRealKnowledge && !isRealProjected) {
      universeProvider.setMode('real');
      setState({
        mode: 'real',
        isDemo: false,
        showDisclaimer: false,
        nodes: realData.nodes || [],
        totalStars: realData.total_stars,
        isProjected: false,
        unprojectedCount: realData.unprojected_count ?? realData.total_stars,
        lastUpdated: new Date().toISOString(),
        loading: false,
        error: null,
      });
      return realData;
    }

    // SCENARIO 3: Zero real knowledge in database (New user)
    if (demoAcceptedInSession) {
      // User previously accepted demo exploration in this session
      universeProvider.setMode('demo');
      setState({
        mode: 'demo',
        isDemo: true,
        showDisclaimer: false,
        nodes: DEMO_NODES,
        totalStars: DEMO_TOTAL_STARS,
        isProjected: true,
        unprojectedCount: 0,
        lastUpdated: new Date().toISOString(),
        loading: false,
        error: null,
      });
      return { total_stars: DEMO_TOTAL_STARS, is_projected: true, nodes: DEMO_NODES, is_demo: true };
    }

    // User has 0 knowledge and hasn't seen/accepted demo yet -> Show Disclaimer Modal
    universeProvider.setMode('real');
    setState({
      mode: 'real',
      isDemo: false,
      showDisclaimer: true,
      nodes: [],
      totalStars: 0,
      isProjected: true,
      unprojectedCount: 0,
      lastUpdated: new Date().toISOString(),
      loading: false,
      error: null,
    });
    return realData;
  } catch (err) {
    setState({
      loading: false,
      error: {
        message: err.message || 'Failed to load Memory Universe',
        status: err.status || 0,
        detail: err.detail || null,
        isUnauthorized: err.isUnauthorized,
        isNetworkError: err.isNetworkError,
      },
    });
    throw err;
  }
}

/**
 * User accepts the demo disclaimer -> Enter functional demo universe
 */
export function enterDemoMode() {
  demoAcceptedInSession = true;
  universeProvider.setMode('demo');

  setState({
    mode: 'demo',
    isDemo: true,
    showDisclaimer: false,
    nodes: DEMO_NODES,
    totalStars: DEMO_TOTAL_STARS,
    isProjected: true,
    unprojectedCount: 0,
    selectedStarId: null,
    navigationTarget: null,
    searchQuery: '',
    filters: { source: 'all', cluster: 'all', knowledgeType: 'all' },
    loading: false,
    error: null,
  });
}

/**
 * User dismisses disclaimer or clicks Exit Demo -> Return to Real Empty State
 */
export function exitDemoMode() {
  demoAcceptedInSession = false;
  universeProvider.setMode('real');

  setState({
    mode: 'real',
    isDemo: false,
    showDisclaimer: false,
    nodes: [],
    totalStars: 0,
    isProjected: true,
    unprojectedCount: 0,
    selectedStarId: null,
    navigationTarget: null,
    searchQuery: '',
    filters: { source: 'all', cluster: 'all', knowledgeType: 'all' },
    loading: false,
    error: null,
  });
}

/**
 * Dismiss the disclaimer modal without entering demo
 */
export function dismissDisclaimer() {
  setState({ showDisclaimer: false });
}

/**
 * Trigger an asynchronous UMAP recalculation of 3D coordinates
 */
export async function triggerRecompute() {
  setState({ recomputing: true, recomputeStatus: null });

  try {
    const response = await universeProvider.recomputeCoordinates();
    setState({
      recomputing: false,
      recomputeStatus: response,
    });

    if (state.mode === 'real' && response.status === 'accepted') {
      setTimeout(() => {
        fetchUniverseNodes().catch(() => {});
      }, 5000);
    }
    return response;
  } catch (err) {
    setState({
      recomputing: false,
      error: {
        message: err.message || 'Failed to trigger universe recomputation',
        status: err.status || 0,
      },
    });
    throw err;
  }
}

/**
 * Select a specific star for detail inspection
 */
export function selectStar(starId) {
  setState({ selectedStarId: starId });
}

/**
 * Clear star selection
 */
export function clearSelection() {
  setState({ selectedStarId: null });
}

/**
 * Set active search query
 */
export function setSearchQuery(query) {
  setState({ searchQuery: query });
}

/**
 * Set a specific facet filter (source, cluster, or knowledgeType)
 */
export function setFacetFilter(facet, value) {
  setState((prev) => ({
    filters: {
      ...prev.filters,
      [facet]: value,
    },
  }));
}

/**
 * Clear all search and filter constraints
 */
export function clearAllFilters() {
  setState({
    searchQuery: '',
    filters: {
      source: 'all',
      cluster: 'all',
      knowledgeType: 'all',
    },
  });
}

/**
 * Command camera to smoothly fly to a specific star and open its details
 * Automatically clears any active filter that would hide the target star.
 *
 * @param {object} node - Target universe node
 */
export function navigateToStar(node) {
  if (!node) return;

  setState((prev) => {
    let updatedFilters = prev.filters;
    const isHiddenBySource =
      prev.filters.source !== 'all' &&
      (prev.filters.source === '__direct__' ? node.has_source : node.source_name !== prev.filters.source);
    const isHiddenByCluster =
      prev.filters.cluster !== 'all' && node.cluster_id !== Number(prev.filters.cluster);
    const isHiddenByType =
      prev.filters.knowledgeType !== 'all' && node.knowledge_type !== prev.filters.knowledgeType;

    if (isHiddenBySource || isHiddenByCluster || isHiddenByType) {
      updatedFilters = {
        source: 'all',
        cluster: 'all',
        knowledgeType: 'all',
      };
    }

    return {
      filters: updatedFilters,
      selectedStarId: node.id,
      navigationTarget: {
        x: node.x,
        y: node.y,
        z: node.z,
        starId: node.id,
        timestamp: Date.now(),
      },
    };
  });
}

/**
 * Reset store to initial state
 */
export function resetStore() {
  demoAcceptedInSession = false;
  universeProvider.setMode('real');
  setState({ ...initialState });
}
