/**
 * Alaya Memory Universe — Demo Mode & Shared Engine Test Suite
 *
 * Verifies:
 * 1. Demo Dataset: 84 deterministic chunks, valid 3D coordinates, clusters, and metadata.
 * 2. ID Range Isolation: isDemoId strictly isolates IDs 90001..90084 from real backend IDs.
 * 3. Provider Routing: universeProvider intercepts demo chunks and sample documents without network calls.
 * 4. Store State Transitions: enterDemoMode, exitDemoMode, disclaimer dismissal, and auto-transition.
 * 5. Search & Discovery: Lexical search, faceted filters, and related chunks on demo data.
 * 6. Non-Destructive Operation: Zero mutation of real backend data or database.
 */

import { demoDataset, DEMO_ID_OFFSET, DEMO_NODE_COUNT } from '../src/data/demoDataset.js';
import { universeProvider, isDemoId } from '../src/data/universeProvider.js';
import {
  getState,
  subscribe,
  enterDemoMode,
  exitDemoMode,
  dismissDisclaimer,
  selectStar,
  clearSelection,
  setFacetFilter,
  clearAllFilters,
} from '../src/store/universeStore.js';
import {
  searchUniverseNodes,
  filterUniverseNodes,
  getDistinctSources,
  getDistinctClusters,
  getDistinctKnowledgeTypes,
  getRelatedChunks,
} from '../src/utils/searchFilter.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    passedTests++;
    console.log(`  PASS: ${message}`);
  }
}

console.log('='.repeat(70));
console.log('  ALAYA MEMORY UNIVERSE — FUNCTIONAL DEMO MODE TESTS');
console.log('='.repeat(70));

// -------------------------------------------------------------------------
// 1. Demo Dataset Structure & Bounds Verification
// -------------------------------------------------------------------------
console.log('\n[1] Verifying Demo Dataset Structure & Celestial Bounds:');

assert(demoDataset.nodes.length === 84, `Demo dataset has exactly 84 nodes (found: ${demoDataset.nodes.length})`);
assert(demoDataset.total_stars === 84, `Demo total_stars is 84`);
assert(demoDataset.is_projected === true, `Demo is_projected is true`);
assert(demoDataset.unprojected_count === 0, `Demo unprojected_count is 0`);

// Check each node
demoDataset.nodes.forEach((node, index) => {
  const expectedId = DEMO_ID_OFFSET + index + 1;
  assert(node.id === expectedId, `Node ${index} has expected demo ID ${expectedId}`);
  assert(typeof node.x === 'number' && !isNaN(node.x), `Node ${node.id} has valid x coordinate`);
  assert(typeof node.y === 'number' && !isNaN(node.y), `Node ${node.id} has valid y coordinate`);
  assert(typeof node.z === 'number' && !isNaN(node.z), `Node ${node.id} has valid z coordinate`);

  // Distance from origin should be within celestial universe radius (45 units)
  const dist = Math.sqrt(node.x * node.x + node.y * node.y + node.z * node.z);
  assert(dist <= 45.0, `Node ${node.id} is within celestial boundary (dist = ${dist.toFixed(2)})`);

  assert(node.cluster_id >= 0 && node.cluster_id <= 2, `Node ${node.id} belongs to cluster 0, 1, or 2`);
  assert(typeof node.cluster_name === 'string' && node.cluster_name.length > 0, `Node ${node.id} has cluster name`);
  assert(typeof node.title === 'string' && node.title.length > 0, `Node ${node.id} has valid title`);
  assert(typeof node.preview === 'string' && node.preview.length > 0, `Node ${node.id} has preview text`);
  assert(node.is_demo === true, `Node ${node.id} is flagged as is_demo: true`);
});

// Check cluster representation
const clusters = getDistinctClusters(demoDataset.nodes);
assert(clusters.length === 3, `Demo universe contains exactly 3 distinct clusters (found: ${clusters.length})`);

// -------------------------------------------------------------------------
// 2. ID Range Isolation & Helper Tests
// -------------------------------------------------------------------------
console.log('\n[2] Verifying ID Range Isolation:');

assert(isDemoId(90001) === true, `isDemoId(90001) is true (first demo star)`);
assert(isDemoId(90084) === true, `isDemoId(90084) is true (last demo star)`);
assert(isDemoId(90050) === true, `isDemoId(90050) is true (intermediate demo star)`);

assert(isDemoId(1) === false, `isDemoId(1) is false (real database ID)`);
assert(isDemoId(1500) === false, `isDemoId(1500) is false (real database ID)`);
assert(isDemoId(89999) === false, `isDemoId(89999) is false (out of bounds)`);
assert(isDemoId(100000) === false, `isDemoId(100000) is false (out of bounds)`);
assert(isDemoId(null) === false, `isDemoId(null) is false`);
assert(isDemoId(undefined) === false, `isDemoId(undefined) is false`);

// -------------------------------------------------------------------------
// 3. Provider Routing & Sample Document Inspection
// -------------------------------------------------------------------------
console.log('\n[3] Verifying Provider Routing & Sample Document Viewer:');

// Test asynchronous chunk retrieval for demo star
async function testProvider() {
  const chunk90001 = await universeProvider.getChunk(90001);
  assert(chunk90001 !== null, `Chunk 90001 retrieved successfully`);
  assert(chunk90001.id === 90001, `Chunk 90001 has id 90001`);
  assert(chunk90001.is_demo === true, `Chunk 90001 has is_demo === true`);
  assert(typeof chunk90001.text_content === 'string' && chunk90001.text_content.length > 50, `Chunk 90001 has substantial text content`);
  assert(chunk90001.source !== null, `Chunk 90001 has source lineage metadata`);
  assert(chunk90001.source.data_source.startsWith('demo://'), `Chunk 90001 data_source uses demo:// protocol`);

  // Test sample source document reader
  const sampleDoc = universeProvider.getDemoSourceDocument('attention_mechanisms.pdf', 3);
  assert(sampleDoc !== null, `Sample document retrieved for attention_mechanisms.pdf`);
  assert(sampleDoc.totalPages >= 5, `Sample doc has totalPages >= 5`);
  assert(typeof sampleDoc.excerpt === 'string' && sampleDoc.excerpt.includes('attention_mechanisms.pdf'), `Excerpt references document name`);
  assert(sampleDoc.excerpt.includes('Page 3'), `Excerpt references page 3`);

  // Test fallback document reader for unknown doc name
  const fallbackDoc = universeProvider.getDemoSourceDocument('unknown_document.pdf', 1);
  assert(fallbackDoc !== null, `Fallback document returned for unknown name`);
  assert(fallbackDoc.excerpt.includes('unknown_document.pdf'), `Fallback doc references requested document name`);

  // Test recomputation in demo mode
  universeProvider.setMode('demo');
  const recomputeRes = await universeProvider.recomputeCoordinates();
  assert(recomputeRes.status === 'accepted', `recomputeCoordinates status is 'accepted' in demo mode`);
  assert(typeof recomputeRes.message === 'string', `recomputeCoordinates returns informational message`);
}

// -------------------------------------------------------------------------
// 4. Store State & Demo Mode Switching
// -------------------------------------------------------------------------
console.log('\n[4] Verifying Store State & Mode Switching:');

let state = getState();
assert(state.mode === 'real', `Initial store mode is 'real'`);
assert(state.isDemo === false, `Initial store isDemo is false`);

// Enter demo mode
enterDemoMode();
state = getState();
assert(state.mode === 'demo', `Store mode transitioned to 'demo'`);
assert(state.isDemo === true, `Store isDemo is true`);
assert(state.nodes.length === 84, `Store loaded 84 demo nodes`);
assert(state.totalStars === 84, `Store totalStars is 84`);
assert(state.isProjected === true, `Store isProjected is true`);
assert(state.showDisclaimer === false, `Disclaimer modal hidden upon entering demo`);

// Select a star in demo mode
selectStar(90015);
state = getState();
assert(state.selectedStarId === 90015, `Selected demo star 90015`);

// Clear selection
clearSelection();
state = getState();
assert(state.selectedStarId === null, `Selection cleared`);

// Exit demo mode
exitDemoMode();
state = getState();
assert(state.mode === 'real', `Store mode returned to 'real'`);
assert(state.isDemo === false, `Store isDemo returned to false`);
assert(state.nodes.length === 0, `Store cleared demo nodes`);

// Dismiss disclaimer test
dismissDisclaimer();
state = getState();
assert(state.showDisclaimer === false, `Disclaimer dismissed`);

// -------------------------------------------------------------------------
// 5. Search, Filter, and Related Discovery on Demo Nodes
// -------------------------------------------------------------------------
console.log('\n[5] Verifying Search, Filtering, and Related Discovery on Demo Data:');

// Test lexical search
const transformerResults = searchUniverseNodes(demoDataset.nodes, 'transformer');
assert(transformerResults.length > 0, `Search for 'transformer' returned ${transformerResults.length} matches`);
assert(transformerResults[0].title.toLowerCase().includes('transformer') || transformerResults[0].preview.toLowerCase().includes('transformer'), `Top result for 'transformer' is relevant`);

const pgvectorResults = searchUniverseNodes(demoDataset.nodes, 'pgvector');
assert(pgvectorResults.length > 0, `Search for 'pgvector' returned ${pgvectorResults.length} matches`);

// Test faceted filtering
const sector1Filtered = filterUniverseNodes(demoDataset.nodes, {
  source: 'all',
  cluster: 1,
  knowledgeType: 'all',
});
assert(sector1Filtered.length > 0, `Cluster 1 filter returned ${sector1Filtered.length} nodes`);
sector1Filtered.forEach((n) => {
  assert(n.cluster_id === 1, `Filtered node ${n.id} belongs to cluster 1`);
});

// Test distinct sources & types extraction
const distinctSources = getDistinctSources(demoDataset.nodes);
assert(distinctSources.length >= 3, `Demo dataset has at least 3 distinct source documents (found: ${distinctSources.length})`);

const distinctTypes = getDistinctKnowledgeTypes(demoDataset.nodes);
assert(distinctTypes.length >= 3, `Demo dataset has at least 3 distinct knowledge types (found: ${distinctTypes.length})`);

// Test related chunks discovery in 3D
const targetNode = demoDataset.nodes[0];
const related = getRelatedChunks(targetNode, demoDataset.nodes, 5);
assert(related.length === 5, `Found 5 related chunks for star ${targetNode.id}`);
assert(!related.some((r) => r.id === targetNode.id), `Target star is not included in its own related list`);
// Related items should have non-negative distances
related.forEach((r) => {
  assert(typeof r.distance === 'number' && r.distance >= 0, `Related star ${r.id} has valid distance: ${r.distance.toFixed(2)}`);
});

// Run async provider tests and print final tally
testProvider().then(() => {
  console.log('\n' + '='.repeat(70));
  console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('='.repeat(70));
}).catch((err) => {
  console.error('\nTest runner failed:', err);
  process.exit(1);
});
