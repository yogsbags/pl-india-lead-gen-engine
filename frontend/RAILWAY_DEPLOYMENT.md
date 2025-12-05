# Railway Deployment Guide

This guide explains how to deploy the PL Capital Lead Generation frontend to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Code must be in a GitHub repository
3. **API Keys**: Get your Apollo and Gemini API keys ready

## Quick Deployment

### 1. Create New Project in Railway

```bash
# Connect your GitHub repository to Railway
# Railway will automatically detect the Next.js app
```

### 2. Configure Build Settings

Railway will automatically detect the configuration from `railway.toml`:

- **Build Command**: `npm run build` (auto-detected)
- **Start Command**: `npm start` (from railway.toml)
- **Install Command**: `npm ci` (auto-detected)
- **Port**: Railway auto-assigns PORT environment variable (typically 8080)

### 3. Set Environment Variables

In Railway dashboard, add these environment variables:

**REQUIRED:**
```
APOLLO_API_KEY=your_apollo_api_key
GEMINI_API_KEY=your_gemini_api_key
```

**OPTIONAL (for full features):**
```
MOENGAGE_APP_ID=your_app_id
MOENGAGE_API_KEY=your_api_key
MOENGAGE_DATA_API_ID=your_data_api_id
MOENGAGE_DATA_API_KEY=your_data_api_key
HEYGEN_API_KEY=your_heygen_key
HEYGEN_AVATAR_ID_SIDDHARTH=your_avatar_id
HEYGEN_VOICE_ID_SIDDHARTH=your_voice_id
```

**DO NOT SET:**
```
PORT (Railway auto-assigns this - typically 8080)
NODE_ENV (Railway sets this to "production" automatically)
```

### 4. Deploy

Railway will automatically build and deploy when you push to your main branch.

## Verify Deployment

### Health Check

After deployment, verify the app is running:

```bash
curl https://your-app.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-05T10:00:00.000Z",
  "service": "lead-generation-frontend",
  "version": "1.0.0"
}
```

### Test Main Pages

- **Home**: `https://your-app.railway.app/`
- **Lead Gen**: `https://your-app.railway.app/lead-gen`
- **Person Search**: `https://your-app.railway.app/person-search`
- **CSV Upload**: `https://your-app.railway.app/csv-upload`

## Troubleshooting

### Build Fails

**Issue**: Build fails with TypeScript errors

**Solution**:
```bash
# Run locally to check for errors
npm run build

# Fix any TypeScript errors before deploying
```

### App Crashes After Start

**Issue**: App starts but crashes immediately (SIGTERM error)

**Possible Causes**:
1. Missing environment variables (check Railway logs)
2. Missing `.next` build directory (ensure build step ran)
3. Port configuration issue (Railway should auto-assign PORT)

**Solution**:
1. Check Railway logs for specific error
2. Verify all REQUIRED env vars are set
3. Ensure `npm run build` completed successfully
4. Check that `railway.toml` exists in repository
5. Verify `package.json` start script uses `$PORT` variable

### API Routes Fail

**Issue**: API routes return 500 errors

**Solution**:
1. Check that `APOLLO_API_KEY` and `GEMINI_API_KEY` are set
2. Verify API keys are valid (test in local environment first)
3. Check Railway logs for specific API error messages

### Health Check Fails

**Issue**: Railway shows "Deployment failed" but no clear error

**Solution**:
1. Verify `/api/health` endpoint is accessible
2. Check that Next.js is listening on the PORT env var
3. Review Railway logs for startup errors

## Monitoring

### View Logs

```bash
# In Railway dashboard:
# 1. Select your project
# 2. Click "Deployments"
# 3. Click latest deployment
# 4. View "Build Logs" and "Deploy Logs"
```

### Key Metrics to Monitor

- **Response Time**: API routes should respond within 2-5 seconds
- **Memory Usage**: Should stay below 512MB for normal operation
- **Error Rate**: Should be <1% for production traffic
- **Build Time**: Should complete within 2-3 minutes

## Configuration Files

The following files control Railway deployment:

### `railway.toml`
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 10
```

### `package.json` (relevant scripts)
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start -p $PORT"
  }
}
```
**Note**: `$PORT` is automatically set by Railway (typically 8080)

## Environment-Specific Configuration

### Development (Local)
```bash
npm run dev # Runs on http://localhost:3005
```

### Production (Railway)
```bash
# Railway automatically runs:
npm ci                    # Install dependencies
npm run build             # Build Next.js app
npm start                 # Start server on $PORT (Railway sets to 8080)
```

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Rotate API keys regularly** - Update in Railway dashboard
3. **Use Railway secrets** - For sensitive data like API keys
4. **Enable HTTPS only** - Railway provides this by default
5. **Monitor API usage** - Set up alerts for Apollo/Gemini usage

## Cost Optimization

Railway pricing is based on:
- **Build minutes**: ~2-3 minutes per deployment
- **Runtime hours**: Charged per hour when running
- **Memory usage**: Higher memory = higher cost

**Tips to reduce costs**:
1. Use Railway's free tier ($5 credit/month)
2. Enable auto-sleep for development environments
3. Optimize build times (cache node_modules)
4. Monitor memory usage and optimize if needed

## Support

If deployment issues persist:

1. **Check Railway Status**: https://status.railway.app
2. **Railway Community**: https://discord.gg/railway
3. **GitHub Issues**: Create issue in your repository
4. **Check Logs**: Always start with Railway deployment logs

---

**Last Updated**: 2025-12-05
**Railway Version**: Nixpacks
**Next.js Version**: 14.2.18
