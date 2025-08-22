const podbbangOptions = {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9,ko;q=0.8",
    "refcode": "null",
    "sec-ch-ua": "\"Chromium\";v=\"94\", \"Microsoft Edge\";v=\"94\", \";Not A Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site"
  },
  "referrer": "https://www.podbbang.com/",
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET",
  "mode": "cors"
};

const podbbangBaseUrl = 'https://app-api6.podbbang.com';

const proxyToPodbbang = async (path, queryString) => {
  const url = `${podbbangBaseUrl}${path}${queryString ? '?' + queryString : ''}`;
  console.log(`Proxying to: ${url}`);
  
  const response = await fetch(url, podbbangOptions);
  return response.json();
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, refcode, accept-language');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Build query string
    const queryString = new URLSearchParams(req.query).toString();
    
    // Simple path mapping like your original
    const url = req.url.split('?')[0]; // Remove query string
    
    if (url.includes('/ranking-new')) {
      const data = await proxyToPodbbang('/ranking-new', queryString);
      res.status(200).json(data);
    } else if (url.includes('/episodes/')) {
      // Extract channel ID from /episodes/16898
      const channelId = url.split('/episodes/')[1];
      const data = await proxyToPodbbang(`/channels/${channelId}/episodes`, queryString);
      res.status(200).json(data);
    } else if (url.includes('/channel/')) {
      // Extract channel ID from /channel/16898
      const channelId = url.split('/channel/')[1];
      const data = await proxyToPodbbang(`/channels/${channelId}/`, queryString);
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: 'Endpoint not found' });
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
}
