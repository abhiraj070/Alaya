import assert from 'node:assert/strict';
import test from 'node:test';
import { universeApi } from '../src/api/universeApi.js';
import { getNodeDetail } from '../src/data/chunkDetail.js';
import { demoUniverse } from '../src/data/demoUniverse.js';
import { getState, resetStore, setUploadedData } from '../src/store/universeStore.js';

const upload = { id: 1, data_type: 'text', data_source: 'My memory', tag: null, created_at: '2026-10-19T00:00:00Z' };

test('uploads use one authenticated, uncached REST request', async (t) => {
  globalThis.sessionStorage = { getItem: () => 'test-token' };
  t.after(() => { delete globalThis.sessionStorage; });
  const fetch = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/universe/uploads');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    return Response.json([upload]);
  });
  assert.deepEqual(await universeApi.getUploads(), [upload]);
  assert.equal(fetch.mock.callCount(), 1);
});

test('a single upload renders and its details need no additional request', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected network request'); });
  resetStore();
  setUploadedData([upload]);
  assert.equal(getState().isDemo, false);
  assert.equal(getState().nodes.length, 1);
  const detail = await getNodeDetail(1, false, getState().nodes[0]);
  assert.equal(detail.text_content, upload.data_source);
  assert.equal(detail.source.id, upload.id);
  assert.equal(fetch.mock.callCount(), 0);
  setUploadedData([]);
  assert.equal(getState().nodes.length, 0);
});

test('demo stars and their details remain local', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected network request'); });
  const { nodes } = demoUniverse.getNodes();
  assert.equal(nodes.length, 84);
  const detail = await getNodeDetail(nodes[0].id, true);
  assert.equal(detail.id, nodes[0].id);
  assert.equal(fetch.mock.callCount(), 0);
});

test('missing upload details do not call removed endpoints', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected network request'); });
  await assert.rejects(getNodeDetail(1, false, null), /Upload details are unavailable/);
  assert.equal(fetch.mock.callCount(), 0);
});
