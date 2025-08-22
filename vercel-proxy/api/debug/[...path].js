export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Debug what Vercel is passing us
  const debugInfo = {
    url: req.url,
    query: req.query,
    pathFromQuery: req.query.path,
    allQueryKeys: Object.keys(req.query),
    method: req.method
  };

  console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
  
  res.status(200).json(debugInfo);
}
