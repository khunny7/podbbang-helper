const retryableStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);

const retryAfterMs = response => {
  const value = response.headers?.get('retry-after');
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 1500);

  const date = Date.parse(value);
  if (Number.isNaN(date)) return null;
  return Math.min(Math.max(0, date - Date.now()), 1500);
};

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export const fetchWithRetry = async (url, init = {}, options = {}) => {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const attempts = Math.max(1, Math.floor(options.attempts ?? 2));
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 250);
  const maxDelayMs = Math.max(0, options.maxDelayMs ?? 1500);

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(url, init);
    } catch (error) {
      if (init.signal?.aborted || error?.name === 'AbortError' || attempt + 1 >= attempts) throw error;
      await wait(Math.min(baseDelayMs * (2 ** attempt), maxDelayMs));
      continue;
    }

    if (!retryableStatuses.has(response.status) || attempt + 1 >= attempts) return response;

    try {
      await response.body?.cancel();
    } catch {
      // Discarding a failed response body is best effort; the retry can still proceed.
    }
    const delay = retryAfterMs(response) ?? Math.min(baseDelayMs * (2 ** attempt), maxDelayMs);
    await wait(delay);
  }

  throw new Error('The upstream request could not be completed.');
};
