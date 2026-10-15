import { fetchWithRetry } from '../../lib/fetch-with-retry.mjs';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, refcode, accept-language');
  res.setHeader('Access-Control-Expose-Headers', 'Retry-After');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Extract channel ID from the URL path
    // Expected URL: /api/episodes/[channelId]
    const urlParts = req.url.split('/');
    const episodesIndex = urlParts.findIndex(part => part === 'episodes');
    
    if (episodesIndex === -1 || episodesIndex + 1 >= urlParts.length) {
      return res.status(400).json({ error: 'Invalid episodes URL format' });
    }
    
    // Get channel ID and remove any query string
    const channelIdWithQuery = urlParts[episodesIndex + 1];
    const channelId = channelIdWithQuery.split('?')[0];
    
    // Build query string
    const queryParams = new URLSearchParams();
    Object.keys(req.query).forEach(key => {
      queryParams.append(key, req.query[key]);
    });
    
    const queryString = queryParams.toString();
    const targetUrl = `https://app-api6.podbbang.com/channels/${channelId}/episodes${queryString ? '?' + queryString : ''}`;
    
    console.log(`Episodes proxy: ${targetUrl}`);

    // Make the upstream request
    const upstreamResponse = await fetchWithRetry(targetUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,ko;q=0.8',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'referer': 'https://www.podbbang.com/',
        'refcode': req.headers.refcode || 'null'
      }
    });

    if (!upstreamResponse.ok) {
      const upstreamStatus = upstreamResponse.status;
      const status = upstreamStatus >= 500 ? 502 : upstreamStatus;
      const retryAfter = upstreamResponse.headers.get('retry-after');
      if (retryAfter) res.setHeader('Retry-After', retryAfter);
      return res.status(status).json({
        error: 'Podbbang upstream error',
        message: `Upstream error: ${upstreamStatus}`,
        upstreamStatus,
      });
    }

    let data;
    try {
      data = await upstreamResponse.json();
    } catch {
      return res.status(502).json({
        error: 'Podbbang returned an unreadable response.',
        message: 'Please retry the request.',
      });
    }
    
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Episodes proxy error:', error);
    res.status(error.name === 'AbortError' ? 504 : 502).json({
      error: 'Episodes proxy error',
      message: 'Could not reach Podbbang. Please retry the request.',
    });
  }
}
