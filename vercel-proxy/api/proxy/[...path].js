// Use native fetch for Node.js 18+ or import node-fetch properly
let fetch;
try {
    // Try native fetch first (Node.js 18+)
    fetch = globalThis.fetch;
    if (!fetch) {
        // Fallback to node-fetch
        fetch = require('node-fetch');
    }
} catch (err) {
    console.error('Error importing fetch:', err);
    // Last resort fallback
    const nodeFetch = require('node-fetch');
    fetch = nodeFetch.default || nodeFetch;
}

// CORS headers
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, refcode, accept, accept-language, x-requested-with, origin, user-agent, sec-ch-ua, sec-ch-ua-mobile, sec-ch-ua-platform, sec-fetch-dest, sec-fetch-mode, sec-fetch-site',
        'Access-Control-Allow-Credentials': 'false',
        'Access-Control-Max-Age': '86400'
    };
}

module.exports = async (req, res) => {
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
        console.log(`${req.method} request to proxy: ${req.url}`);
        console.log(`Query params:`, req.query);
        console.log(`Origin:`, req.headers.origin || 'no-origin');
        
        // Handle CORS preflight - return immediately with 200
        if (req.method === 'OPTIONS') {
            console.log('Handling CORS preflight request');
            res.statusCode = 200;
            res.end();
            return;
        }

        // Extract path from query parameter (Vercel dynamic routing)
        // In Vercel, [...path] creates a query param with key '...path' containing an array of path segments
        let pathSegments = req.query['...path'] || req.query.path || [];
        
        // If it's a string (single segment), convert to array
        if (typeof pathSegments === 'string') {
            pathSegments = [pathSegments];
        }
        
        const path = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;
        
        console.log(`Path segments:`, pathSegments);
        console.log(`Extracted path: ${path}`);
        
        // Build query string from other query parameters (excluding 'path' and '...path')
        const queryParams = new URLSearchParams();
        Object.keys(req.query).forEach(key => {
            if (key !== 'path' && key !== '...path') {
                queryParams.append(key, req.query[key]);
            }
        });
        
        const queryString = queryParams.toString();
        const targetUrl = `https://app-api6.podbbang.com/${path}${queryString ? '?' + queryString : ''}`;
        console.log(`Proxying -> ${targetUrl}`);

        // Build headers for upstream request
        const upstreamHeaders = {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9,ko;q=0.8',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'referer': 'https://www.podbbang.com/',
            'sec-ch-ua': '"Chromium";v="94", "Microsoft Edge";v="94", ";Not A Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site'
        };
        
        // Forward refcode header if present
        if (req.headers.refcode) {
            upstreamHeaders['refcode'] = req.headers.refcode;
        }
        
        console.log('Making upstream request with headers:', upstreamHeaders);
        
        const upstream = await fetch(targetUrl, {
            method: 'GET',
            headers: upstreamHeaders
        });

        console.log(`Upstream response status: ${upstream.status}`);
        console.log(`Upstream response headers:`, Object.fromEntries(upstream.headers.entries()));
        
        if (!upstream.ok) {
            const errorText = await upstream.text();
            console.error(`Upstream error: ${upstream.status} - ${errorText}`);
            throw new Error(`Upstream status ${upstream.status}: ${errorText}`);
        }

        // Get the response as text first to check what we're receiving
        const responseText = await upstream.text();
        console.log('Upstream response text (first 200 chars):', responseText.substring(0, 200));
        
        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
            console.log('Successfully parsed JSON data');
        } catch (parseErr) {
            console.error('Failed to parse JSON:', parseErr.message);
            console.error('Response text:', responseText);
            throw new Error(`Invalid JSON response: ${parseErr.message}`);
        }

        // Send successful response
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));

    } catch (err) {
        console.error('Proxy error', err);
        console.error('Error stack:', err.stack);
        
        // Send error response
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
            error: 'Proxy error', 
            message: err.message 
        }));
    }
};
