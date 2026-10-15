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

export function transformUploadedDataToNodes(uploadedData) {
  const total = (uploadedData || []).length;
  return (uploadedData || []).map((item, index) => {
    const isDoc = item.data_type === 'docs';
    const isImg = item.data_type === 'img';

    let title = item.tag || '';
    let preview = item.data_source || '';
    let sourceName = null;

    if (isDoc || isImg) {
      try {
        const url = new URL(item.data_source);
        const parts = url.pathname.split('/');
        sourceName = decodeURIComponent(parts[parts.length - 1] || '');
      } catch {
        sourceName = item.data_source;
      }
      if (!title) {
        title = sourceName || (isDoc ? `Document #${item.id}` : `Image #${item.id}`);
      }
      preview = `${isDoc ? 'Document' : 'Image'}: ${sourceName}`;
    } else {
      if (!title) {
        title = item.data_source.slice(0, 40) + (item.data_source.length > 40 ? '...' : '');
      }
      preview = item.data_source;
      sourceName = item.tag || 'Direct Memory';
    }

    const phi = Math.acos(1 - (2 * (index + 0.5)) / Math.max(total, 1));
    const theta = Math.PI * (1 + Math.sqrt(5)) * (index + 1);
    const radius = 18 + ((item.id * 17) % 10);
    const x = Number((radius * Math.sin(phi) * Math.cos(theta)).toFixed(2));
    const y = Number((radius * Math.sin(phi) * Math.sin(theta)).toFixed(2));
    const z = Number((radius * Math.cos(phi)).toFixed(2));

    return {
      id: item.id,
      record_type: 'upload',
      title,
      preview,
      text_content: item.data_source,
      content_type: item.data_type,
      source_type: item.data_type,
      source_name: sourceName,
      has_source: Boolean(isDoc || isImg),
      knowledge_type: isDoc ? 'document' : isImg ? 'image' : 'memory',
      cluster_id: isDoc ? 0 : isImg ? 1 : 2,
      cluster_name: isDoc ? 'Documents' : isImg ? 'Images' : 'Text',
      x,
      y,
      z,
      created_at: item.created_at,
      metadata: {
        tag: item.tag,
        data_source: item.data_source,
        data_type: item.data_type,
      },
      source: {
        id: item.id,
        data_type: item.data_type,
        tag: item.tag,
        data_source: item.data_source,
        created_at: item.created_at,
      },
    };
  });
}

/** Replace the displayed collection. An empty response must clear deleted records. */
export function applyUniverseSnapshot({ nodes = [], total_stars, unprojected_count }, { isDemo = false } = {}) {
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
  const nodes = transformUploadedDataToNodes(uploadedData);
  applyUniverseSnapshot({ nodes });
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
