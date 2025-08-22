const fetch = require('node-fetch');

// CORS headers
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, refcode, accept, accept-language'
    };
}

module.exports = async (req, res) => {
    console.log(`${req.method} request to proxy: ${req.url}`);
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        console.log('Handling CORS preflight request');
        return res.status(200).set(corsHeaders()).end();
    }

    // Extract path - remove /api/proxy from the beginning
    let path = req.url.replace(/^\/api\/proxy\/?/, '');
    
    // If path starts with ?, it means there's no path, just query params
    if (path.startsWith('?')) {
        path = '' + path;
    }
    
    // If there's no path and no query, default to empty
    if (!path) {
        path = '';
    }

    const targetUrl = `https://app-api6.podbbang.com/${path}`;
    console.log(`Proxying -> ${targetUrl}`);

    try {
        // Build headers for upstream request
        const upstreamHeaders = {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9,ko;q=0.8'
        };
        
        // Forward refcode header if present
        if (req.headers.refcode) {
            upstreamHeaders['refcode'] = req.headers.refcode;
        }
        
        const upstream = await fetch(targetUrl, {
            method: 'GET',
            headers: upstreamHeaders
        });

        if (!upstream.ok) {
            throw new Error(`Upstream status ${upstream.status}`);
        }

        const data = await upstream.json();

        res.status(200)
           .set({
               ...corsHeaders(),
               'Content-Type': 'application/json'
           })
           .json(data);

    } catch (err) {
        console.error('Proxy error', err);
        res.status(500)
           .set({
               ...corsHeaders(),
               'Content-Type': 'application/json'
           })
           .json({ error: 'Proxy error', message: err.message });
    }
};
