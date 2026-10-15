import { fetchWithRetry } from './fetch-with-retry.mjs';

const defaultBaseUrl = 'https://vercel-proxy-five-sage.vercel.app/api';
const baseUrl = (
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : defaultBaseUrl)
).replace(/\/$/, '');

const getJson = async (path, signal) => {
  let response;
  const requestController = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    requestController.abort();
  }, 15000);
  const cancelRequest = () => requestController.abort();

  if (signal?.aborted) {
    clearTimeout(timeout);
    throw new DOMException('The request was cancelled.', 'AbortError');
  }
  signal?.addEventListener('abort', cancelRequest, { once: true });

  try {
    response = await fetchWithRetry(`${baseUrl}${path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        refcode: 'null',
      },
      signal: requestController.signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timedOut) throw new Error('Podbbang took too long to respond. Try again.');
    throw new Error('Could not reach Podbbang. Check your connection and try again.');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancelRequest);
  }

  if (!response.ok) {
    const error = new Error(
      response.status === 429
        ? 'Podbbang is receiving too many requests. Try again shortly.'
        : `Podbbang request failed (HTTP ${response.status}). Try again.`
    );
    error.status = response.status;
    throw error;
  }

  try {
    return await response.json();
  } catch {
    throw new Error('Podbbang returned an unreadable response. Try again.');
  }
};

const getEpisodes = (channelId = 16898, options = {}) => {
  const { pageIndex = 0, limit = 20, keyword = null, signal } = options;
  const query = new URLSearchParams({
    // Podbbang treats `offset` as a zero-based page index for episodes.
    offset: String(Math.max(0, Math.floor(Number(pageIndex) || 0))),
    limit: String(Math.min(100, Math.max(1, Number(limit) || 20))),
    sort: 'desc',
  });
  if (keyword?.trim()) query.set('keyword', keyword.trim());
  return getJson(`/episodes/${encodeURIComponent(channelId)}?${query}`, signal);
};

const getChannelInfo = (channelId = 16898, signal) =>
  getJson(`/channel/${encodeURIComponent(channelId)}`, signal);

const getChannels = (pageIndex = 0, limit = 20, signal, options = {}) => {
  const safePageIndex = Math.max(0, Math.floor(Number(pageIndex) || 0));
  const rankingType = ['hourly', 'weekly'].includes(options.rankingType) ? options.rankingType : 'hourly';
  const categoryId = Math.max(0, Math.floor(Number(options.categoryId) || 0));
  const query = new URLSearchParams({
    type: rankingType,
    category_id: String(categoryId),
    create_time: String(options.createTime ?? Math.floor(Date.now() / 1000)),
    offset: String(safePageIndex),
    limit: String(Math.min(100, Math.max(1, Number(limit) || 20))),
  });
  return getJson(`/ranking-new?${query}`, signal);
};

export { getEpisodes, getChannelInfo, getChannels };
