module.exports = async (req, res) => {
    console.log('Test endpoint called');
    
    // Set CORS headers immediately for all requests
    const corsHeadersObj = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, refcode, accept, accept-language, x-requested-with, origin, user-agent',
        'Access-Control-Allow-Credentials': 'false',
        'Access-Control-Max-Age': '86400'
    };
    
    // Set CORS headers immediately
    Object.keys(corsHeadersObj).forEach(key => {
        res.setHeader(key, corsHeadersObj[key]);
    });
    
    try {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            console.log('Handling CORS preflight for test endpoint');
            res.statusCode = 200;
            res.end();
            return;
        }
        
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
            message: 'Test endpoint working with CORS', 
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            query: req.query,
            origin: req.headers.origin || 'no-origin'
        }));
    } catch (err) {
        console.error('Test error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Test error', message: err.message }));
    }
};
