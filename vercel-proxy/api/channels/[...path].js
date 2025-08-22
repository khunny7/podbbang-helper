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
    // Extract channel ID and action from the URL
    // URL pattern: /api/channels/{channelId}/episodes or /api/channels/{channelId}
    const urlParts = req.url.split('/');
    const channelIndex = urlParts.findIndex(part => part === 'channels');
    
    if (channelIndex === -1 || channelIndex + 1 >= urlParts.length) {
      return res.status(400).json({ error: 'Invalid channel URL format' });
    }
    
    const channelId = urlParts[channelIndex + 1];
    const action = urlParts[channelIndex + 2]; // might be 'episodes' or undefined
    
    let targetPath;
    if (action) {
      // Remove query string from action if present
      const cleanAction = action.split('?')[0];
      targetPath = `channels/${channelId}/${cleanAction}`;
    } else {
      targetPath = `channels/${channelId}`;
    }
    
    // Build query string
    const queryParams = new URLSearchParams();
    Object.keys(req.query).forEach(key => {
      queryParams.append(key, req.query[key]);
    });
    
    const queryString = queryParams.toString();
    const targetUrl = `https://app-api6.podbbang.com/${targetPath}${queryString ? '?' + queryString : ''}`;
    
    console.log(`Channels proxy: ${targetUrl}`);

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
    console.error('Channels proxy error:', error);
    res.status(500).json({ 
      error: 'Channels proxy error', 
      message: error.message 
    });
  }
}
