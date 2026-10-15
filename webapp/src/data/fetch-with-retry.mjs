const retryableStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);

const abortError = () => {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('The request was cancelled.', 'AbortError');
  }
  const error = new Error('The request was cancelled.');
  error.name = 'AbortError';
  return error;
};

const retryAfterMs = response => {
  const value = response.headers?.get('retry-after');
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 1500);

  const date = Date.parse(value);
  if (Number.isNaN(date)) return null;
  return Math.min(Math.max(0, date - Date.now()), 1500);
};

const wait = (milliseconds, signal) => {
  if (signal?.aborted) return Promise.reject(abortError());
  if (milliseconds <= 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    };
    const timer = setTimeout(finish, milliseconds);
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      reject(abortError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
};

export const fetchWithRetry = async (url, init = {}, options = {}) => {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const attempts = Math.max(1, Math.floor(options.attempts ?? 2));
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 250);
  const maxDelayMs = Math.max(0, options.maxDelayMs ?? 1500);
  const signal = init.signal;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (signal?.aborted) throw abortError();

    let response;
    try {
      response = await fetchImpl(url, init);
    } catch (error) {
      if (signal?.aborted || error?.name === 'AbortError' || attempt + 1 >= attempts) throw error;
      await wait(Math.min(baseDelayMs * (2 ** attempt), maxDelayMs), signal);
      continue;
    }

    if (!retryableStatuses.has(response.status) || attempt + 1 >= attempts) return response;

    try {
      await response.body?.cancel();
    } catch {
      // Discarding a failed response body is best effort; the retry can still proceed.
    }
    const delay = retryAfterMs(response) ?? Math.min(baseDelayMs * (2 ** attempt), maxDelayMs);
    await wait(delay, signal);
  }

  throw new Error('The request could not be completed.');
};
