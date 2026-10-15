// Display state only. Data loaders deliver the same snapshot regardless of transport.
import { filterUniverseNodes } from '../utils/searchFilter.js';

const defaultFilters = () => ({ source: 'all', cluster: 'all', knowledgeType: 'all' });
const initialState = () => ({
  isDemo: false,
  nodes: [],
  totalStars: 0,
  unprojectedCount: 0,
  selectedStarId: null,
  navigationTarget: null,
  filters: defaultFilters(),
  uploadedData: [],
});

let state = initialState();
let navigationSequence = 0;
const listeners = new Set();

export const getState = () => state;

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setState(partial) {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener());
}

/** Replace the displayed collection with a /api/universe/nodes snapshot. */
export function applyUniverseSnapshot({ nodes, total_stars, unprojected_count }, { isDemo = false } = {}) {
  const modeChanged = state.isDemo !== isDemo;
  const selectionExists = !modeChanged && nodes.some((node) => node.id === state.selectedStarId);
  setState({
    isDemo,
    nodes,
    totalStars: total_stars ?? nodes.length,
    unprojectedCount: unprojected_count ?? 0,
    selectedStarId: selectionExists ? state.selectedStarId : null,
    navigationTarget: null,
    filters: modeChanged ? defaultFilters() : state.filters,
  });
}

export function selectStar(starId) {
  setState({ selectedStarId: starId });
}

export function clearSelection() {
  setState({ selectedStarId: null });
}

export function setFacetFilter(facet, value) {
  setState({ filters: { ...state.filters, [facet]: value } });
}

export function clearAllFilters() {
  setState({ filters: defaultFilters() });
}

export function setUploadedData(uploadedData) {
  setState({ uploadedData });
}

export function navigateToStar(node) {
  if (!node) return;
  const visible = filterUniverseNodes([node], state.filters).length > 0;
  setState({
    filters: visible ? state.filters : defaultFilters(),
    selectedStarId: node.id,
    navigationTarget: {
      x: node.x, y: node.y, z: node.z,
      starId: node.id,
      timestamp: ++navigationSequence,
    },
  });
}

export function resetStore() {
  setState(initialState());
}
