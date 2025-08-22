# Legacy Server (DEPRECATED)

⚠️ **This server is no longer used and has been deprecated.**

## Migration Summary

This Express.js server was originally used as a CORS proxy for the Podbbang API. It has been replaced by:

- **Web App**: Now uses Vercel serverless functions (`vercel-proxy/`)
- **Electron App**: Directly accesses the original API (no CORS issues in Electron)

## Why It's Kept

These files are preserved for:
- **Reference**: The original proxy implementation was elegant and simple
- **History**: Shows the evolution from local server → serverless
- **Documentation**: Original approach in `routes/proxy.js` (53 lines of beautiful code!)

## Original Functionality

The server provided:
- CORS proxy for web browsers
- Episode downloads 
- Local development server

## Current Status

- ❌ No longer installed in workspace
- ❌ Dependencies removed  
- ❌ Scripts removed
- ✅ Code preserved for reference

## Migration Path

**Before:**
```
Web App → Local Server (port 3080) → Podbbang API
```

**After:**
```
Web App → Vercel Proxy → Podbbang API
Electron → Podbbang API (direct)
```

---
*Last used: August 2025 - Replaced by Vercel serverless functions*
