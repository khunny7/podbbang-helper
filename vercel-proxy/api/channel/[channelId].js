export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, refcode, accept-language');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Extract channel ID from the URL path
    // Expected URL: /api/channel/[channelId]
    const urlParts = req.url.split('/');
    const channelIndex = urlParts.findIndex(part => part === 'channel');
    
    if (channelIndex === -1 || channelIndex + 1 >= urlParts.length) {
      return res.status(400).json({ error: 'Invalid channel URL format' });
    }
    
    // Get channel ID and remove any query string
    const channelIdWithQuery = urlParts[channelIndex + 1];
    const channelId = channelIdWithQuery.split('?')[0];
    
    // Build query string
    const queryParams = new URLSearchParams();
    Object.keys(req.query).forEach(key => {
      queryParams.append(key, req.query[key]);
    });
    
    const queryString = queryParams.toString();
    const targetUrl = `https://app-api6.podbbang.com/channels/${channelId}/${queryString ? '?' + queryString : ''}`;
    
    console.log(`Channel proxy: ${targetUrl}`);

    // Make the upstream request
    const upstreamResponse = await fetch(targetUrl, {
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
      throw new Error(`Upstream error: ${upstreamResponse.status}`);
    }

    const data = await upstreamResponse.json();
    
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Channel proxy error:', error);
    res.status(500).json({ 
      error: 'Channel proxy error', 
      message: error.message 
    });
  }
}
