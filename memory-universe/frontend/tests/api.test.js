import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { apiClient, ApiError } from '../src/api/client.js';
import { universeApi } from '../src/api/universeApi.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('the API adapter forwards cookies and request cancellation', async () => {
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/universe/chunks/42');
    assert.equal(options.credentials, 'include');
    assert.equal(options.signal, controller.signal);
    return Response.json({ id: 42 });
  };
  assert.deepEqual(await universeApi.getChunk(42, { signal: controller.signal }), { id: 42 });
});

test('authentication failures retain HTTP status and server detail', async () => {
  globalThis.fetch = async () => Response.json({ detail: 'Session expired' }, { status: 401 });
  await assert.rejects(apiClient('/api/universe/nodes'), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.isUnauthorized, true);
    assert.equal(error.detail, 'Session expired');
    return true;
  });
});

test('cancellation is not converted into a network failure', async () => {
  const controller = new AbortController();
  controller.abort();
  globalThis.fetch = async () => { throw controller.signal.reason; };
  await assert.rejects(apiClient('/api/universe/nodes', { signal: controller.signal }), { name: 'AbortError' });
});
