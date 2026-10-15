import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchWithRetry } from '../lib/fetch-with-retry.mjs';

const response = (status, body = '{}', headers = {}) => new Response(body, { status, headers });

test('retries a transient Podbbang response once', async () => {
  let calls = 0;
  const result = await fetchWithRetry('https://podbbang.example/episodes', {}, {
    baseDelayMs: 0,
    fetchImpl: async () => {
      calls += 1;
      return calls === 1 ? response(500) : response(200);
    },
  });

  assert.equal(result.status, 200);
  assert.equal(calls, 2);
});

test('returns a persistent upstream error after the retry budget', async () => {
  let calls = 0;
  const result = await fetchWithRetry('https://podbbang.example/episodes', {}, {
    baseDelayMs: 0,
    fetchImpl: async () => {
      calls += 1;
      return response(500);
    },
  });

  assert.equal(result.status, 500);
  assert.equal(calls, 2);
});
