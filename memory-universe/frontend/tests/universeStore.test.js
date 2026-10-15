import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getState, subscribe, applyUniverseSnapshot, selectStar, clearSelection,
  setFacetFilter, clearAllFilters, navigateToStar, resetStore,
} from '../src/store/universeStore.js';

const nodes = [
  { id: 1, x: 2, y: 3, z: 4, has_source: false, cluster_id: 0, knowledge_type: 'fact' },
  { id: 2, x: -2, y: 0, z: 1, has_source: true, source_name: 'notes.pdf', cluster_id: 1, knowledge_type: 'document' },
];

beforeEach(resetStore);

test('snapshots update counts and notify subscribers without a transport', () => {
  let notifications = 0;
  const unsubscribe = subscribe(() => notifications++);
  applyUniverseSnapshot({ nodes, total_stars: 3, unprojected_count: 1 });
  assert.equal(getState().nodes, nodes);
  assert.equal(getState().totalStars, 3);
  assert.equal(getState().unprojectedCount, 1);
  assert.equal(notifications, 1);
  unsubscribe();
  clearSelection();
  assert.equal(notifications, 1);
});

test('refresh preserves an existing selection and clears a removed selection', () => {
  applyUniverseSnapshot({ nodes });
  selectStar(1);
  applyUniverseSnapshot({ nodes: [...nodes] });
  assert.equal(getState().selectedStarId, 1);
  applyUniverseSnapshot({ nodes: [nodes[1]] });
  assert.equal(getState().selectedStarId, null);
  assert.equal(getState().navigationTarget, null);
});

test('navigation reveals a hidden target and repeated flights have distinct triggers', () => {
  setFacetFilter('source', 'notes.pdf');
  navigateToStar(nodes[0]);
  assert.equal(getState().filters.source, 'all');
  assert.equal(getState().selectedStarId, 1);
  assert.deepEqual(
    [getState().navigationTarget.x, getState().navigationTarget.y, getState().navigationTarget.z],
    [2, 3, 4],
  );
  const firstTrigger = getState().navigationTarget.timestamp;
  navigateToStar(nodes[0]);
  assert.notEqual(getState().navigationTarget.timestamp, firstTrigger);
});

test('navigation preserves compatible filters; clearing filters restores defaults', () => {
  setFacetFilter('cluster', '1');
  navigateToStar(nodes[1]);
  assert.equal(getState().filters.cluster, '1');
  clearAllFilters();
  assert.deepEqual(getState().filters, { source: 'all', cluster: 'all', knowledgeType: 'all' });
});

test('an empty snapshot clears previous collection counts and selection', () => {
  applyUniverseSnapshot({ nodes, total_stars: 5, unprojected_count: 3 });
  selectStar(2);
  applyUniverseSnapshot({ nodes: [] });
  assert.equal(getState().totalStars, 0);
  assert.equal(getState().unprojectedCount, 0);
  assert.equal(getState().selectedStarId, null);
});

test('switching demo and real snapshots clears selection and filters even when IDs overlap', () => {
  applyUniverseSnapshot({ nodes }, { isDemo: true });
  navigateToStar(nodes[0]);
  setFacetFilter('cluster', '0');
  assert.equal(getState().isDemo, true);
  applyUniverseSnapshot({ nodes });
  assert.equal(getState().isDemo, false);
  assert.equal(getState().selectedStarId, null);
  assert.equal(getState().navigationTarget, null);
  assert.equal(getState().filters.cluster, 'all');
  selectStar(1);
  setFacetFilter('source', 'notes.pdf');
  applyUniverseSnapshot({ nodes }, { isDemo: true });
  assert.equal(getState().selectedStarId, null);
  assert.equal(getState().filters.source, 'all');
  resetStore();
  assert.equal(getState().isDemo, false);
  assert.equal(getState().nodes.length, 0);
});
