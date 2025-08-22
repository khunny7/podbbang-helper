# Podbbang Proxy - Vercel Deployment

This is a serverless proxy function for the Podbbang API, deployed on Vercel's free tier.

## Features
- **100% Free** on Vercel
- CORS handling for web browsers
- Proxy requests to `https://app-api6.podbbang.com`
- Supports all query parameters and the `refcode` header

## Local Development

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Install dependencies:
```bash
cd vercel-proxy
npm install
```

3. Run locally:
```bash
vercel dev
```

The proxy will be available at: `http://localhost:3000/api/proxy/`

## Deployment to Vercel

### Option 1: Via Vercel CLI
```bash
cd vercel-proxy
vercel --prod
```

### Option 2: Via GitHub (Recommended)
1. Push this code to your GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Sign up/login with GitHub
4. Import your repository
5. Set the root directory to `vercel-proxy`
6. Deploy!

## Usage

Once deployed, your proxy will be available at:
```
https://your-project-name.vercel.app/api/proxy/
```

Update your webapp to use this URL instead of the local Azure Function.

## Free Tier Limits
- 100GB bandwidth per month
- 100 serverless function invocations per day (hobby plan)
- More than enough for personal projects!
