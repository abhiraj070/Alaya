import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { demoUniverse } from '../src/data/demoUniverse.js';
import { universeApi } from '../src/api/universeApi.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('the original demo has 84 inspectable stars in three sectors, without network access', async () => {
  globalThis.fetch = () => { throw new Error('Demo must not fetch'); };
  const snapshot = demoUniverse.getNodes();
  assert.equal(snapshot.total_stars, 84);
  assert.equal(new Set(snapshot.nodes.map((node) => node.id)).size, 84);
  assert.equal(new Set(snapshot.nodes.map((node) => node.cluster_id)).size, 3);
  for (const node of snapshot.nodes) {
    assert.ok([node.x, node.y, node.z].every(Number.isFinite));
    assert.ok(Math.hypot(node.x, node.y, node.z) <= 45);
    const chunk = await demoUniverse.getChunk(node.id);
    assert.equal(chunk.id, node.id);
    assert.equal(chunk.is_demo, true);
    assert.ok(chunk.text_content);
    if (node.has_source) {
      const doc = demoUniverse.getSourceDocument(node.source_name, chunk.page_number);
      assert.ok(doc.excerpt.includes(chunk.text_content));
      assert.ok(doc.totalPages >= chunk.page_number);
    }
  }
  await assert.rejects(demoUniverse.getChunk(1), /not found/);
});

test('real knowledge IDs in the old demo range still use the backend in real mode', async () => {
  globalThis.fetch = async (url) => {
    assert.equal(url, '/api/universe/chunks/90001');
    return Response.json({ id: 90001, text_content: 'A real memory' });
  };
  const realChunk = await universeApi.getChunk(90001);
  const sampleChunk = await demoUniverse.getChunk(90001);
  assert.equal(realChunk.text_content, 'A real memory');
  assert.notEqual(sampleChunk.text_content, realChunk.text_content);
});
