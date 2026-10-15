import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchWithRetry } from './fetch-with-retry.mjs';

const response = (status, body = '{}', headers = {}) => new Response(body, { status, headers });

test('retries a transient server response and returns the successful response', async () => {
  let calls = 0;
  const result = await fetchWithRetry('/episodes/123', {}, {
    baseDelayMs: 0,
    fetchImpl: async () => {
      calls += 1;
      return calls === 1 ? response(500) : response(200, '{"data":[]}');
    },
  });

  assert.equal(calls, 2);
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { data: [] });
});

test('does not retry non-transient client errors', async () => {
  let calls = 0;
  const result = await fetchWithRetry('/episodes/123', {}, {
    baseDelayMs: 0,
    fetchImpl: async () => {
      calls += 1;
      return response(404);
    },
  });

  assert.equal(result.status, 404);
  assert.equal(calls, 1);
});

test('retries a network failure once', async () => {
  let calls = 0;
  const result = await fetchWithRetry('/episodes/123', {}, {
    baseDelayMs: 0,
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) throw new TypeError('connection reset');
      return response(200);
    },
  });

  assert.equal(result.status, 200);
  assert.equal(calls, 2);
});

test('cancels a pending retry when the caller aborts', async () => {
  const controller = new AbortController();
  let calls = 0;
  const request = fetchWithRetry('/episodes/123', { signal: controller.signal }, {
    baseDelayMs: 100,
    maxDelayMs: 100,
    fetchImpl: async () => {
      calls += 1;
      return response(503);
    },
  });
  setTimeout(() => controller.abort(), 5);

  await assert.rejects(request, error => error.name === 'AbortError');
  assert.equal(calls, 1);
});
