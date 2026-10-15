import test from 'node:test';
import assert from 'node:assert/strict';
import { getSourceViewUrl, formatSourceLabel, extractFilename } from '../src/utils/sourceDocument.js';
import { getStarColor, getStarScale } from '../src/utils/celestialColors.js';
import {
  searchUniverseNodes, filterUniverseNodes, getRelatedChunks,
  getDistinctSources, getDistinctClusters, getDistinctKnowledgeTypes,
} from '../src/utils/searchFilter.js';

const nodes = [
  { id: 1, x: 0, y: 0, z: 0, title: 'Financial overview', preview: 'Annual revenue', has_source: true, source_name: 'report.pdf', cluster_id: 0, cluster_name: 'Sector 0', knowledge_type: 'finance' },
  { id: 2, x: 1, y: 0, z: 0, title: 'Expenses', preview: 'Consulting costs', has_source: true, source_name: 'report.pdf', cluster_id: 0, cluster_name: 'Sector 0', knowledge_type: 'finance' },
  { id: 3, x: 25, y: 0, z: 0, title: 'Tennis', preview: 'Federer', has_source: false, cluster_id: 1, cluster_name: 'Sector 1', knowledge_type: 'interest' },
];

test('search finds titles, contents and documents, and handles empty queries', () => {
  assert.equal(searchUniverseNodes(nodes, 'financial')[0].id, 1);
  assert.equal(searchUniverseNodes(nodes, 'Federer')[0].id, 3);
  assert.equal(searchUniverseNodes(nodes, 'report.pdf').length, 2);
  assert.deepEqual(searchUniverseNodes(nodes, '  '), []);
});

test('facets compose without modifying the original collection', () => {
  assert.deepEqual(filterUniverseNodes(nodes, { source: '__direct__' }).map((n) => n.id), [3]);
  assert.equal(filterUniverseNodes(nodes, { source: 'report.pdf', cluster: '0', knowledgeType: 'finance' }).length, 2);
  assert.equal(filterUniverseNodes(nodes, { source: 'report.pdf', cluster: '1' }).length, 0);
  assert.equal(nodes.length, 3);
  assert.equal(getDistinctSources(nodes).length, 2);
  assert.equal(getDistinctClusters(nodes).length, 2);
  assert.equal(getDistinctKnowledgeTypes(nodes).length, 2);
});

test('related chunks rank nearby knowledge and exclude the selected node', () => {
  const related = getRelatedChunks(nodes[0], nodes, 3);
  assert.equal(related[0].node.id, 2);
  assert.equal(related[0].sameCluster, true);
  assert.ok(related.every((item) => item.node.id !== 1));
});

test('source links support PDF pages and suppress absent or invalid sources', () => {
  const source = { data_type: 'docs', tag: 'pdf', data_source: 'https://example.com/report.pdf#old' };
  assert.equal(getSourceViewUrl(source, 7), 'https://example.com/report.pdf#page=7');
  assert.equal(getSourceViewUrl(null), null);
  assert.equal(getSourceViewUrl({ ...source, data_type: 'text' }), null);
  assert.equal(getSourceViewUrl({ ...source, data_source: 'javascript:alert(1)' }), null);
  assert.equal(formatSourceLabel('docs', 'pdf'), 'PDF Document');
  assert.equal(extractFilename('https://example.com/my%20notes.pdf?version=1'), 'my notes.pdf');
});

test('selected and hovered stars retain their visual emphasis', () => {
  const node = nodes[0];
  assert.ok(getStarScale(node, true, false) > getStarScale(node, false, false));
  assert.equal(getStarColor(node, true, false).getHexString(), '7dd3fc');
  assert.equal(getStarColor(node, false, true).getHexString(), 'ffffff');
});

test('star colors are determined by content type: documents red, images blue, text yellow', () => {
  const docNode = { id: 10, source_type: 'docs', cluster_id: 1 };
  const imgNode = { id: 11, source_type: 'img', cluster_id: 2 };
  const textNode = { id: 12, source_type: 'text', cluster_id: 3 };
  const directNode = { id: 13, has_source: false, cluster_id: 0 };
  const unknownNode = { id: 14, source_type: 'audio', cluster_id: 0 };

  // Documents: #EF4444
  assert.equal(getStarColor(docNode).getHexString(), 'ef4444');
  // Images: #3B82F6
  assert.equal(getStarColor(imgNode).getHexString(), '3b82f6');
  // Text: #FACC15
  assert.equal(getStarColor(textNode).getHexString(), 'facc15');
  // Direct text knowledge (no source): #FACC15
  assert.equal(getStarColor(directNode).getHexString(), 'facc15');
  // Unknown / unsupported type: neutral fallback #94A3B8
  assert.equal(getStarColor(unknownNode).getHexString(), '94a3b8');

  // Verify cluster_id does NOT dictate star color
  const docCluster0 = { id: 20, source_type: 'docs', cluster_id: 0 };
  const docCluster5 = { id: 21, source_type: 'docs', cluster_id: 5 };
  assert.equal(getStarColor(docCluster0).getHexString(), 'ef4444');
  assert.equal(getStarColor(docCluster5).getHexString(), 'ef4444');
});

