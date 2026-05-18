# Build and Deployment Review — Fondea App

**Date:** May 18, 2026  
**Status:** ✅ Ready for deployment with minor improvements

---

## 1. Build Configuration

### ✅ Next.js Setup
- **Version:** 16.2.4 (Turbopack enabled)
- **React:** 19.2.4
- **TypeScript:** 5.x (strict mode enabled)
- **Build Scripts:** ✅ Correct

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

**Status:** Build scripts are standard and correct. No custom configuration needed.

### ✅ TypeScript Configuration
- **Target:** ES2017 (good for modern browsers)
- **Strict Mode:** ✅ Enabled
- **Path Aliases:** ✅ Configured (`@/*` → root)
- **Module Resolution:** bundler (correct for Next.js)

**Status:** TypeScript config is solid. No changes needed.

### ✅ PostCSS & Tailwind
- **PostCSS:** Using `@tailwindcss/postcss` v4 (latest)
- **Tailwind:** v4 (latest)
- **Config:** Minimal but correct

**Status:** CSS pipeline is modern and optimized.

### ⚠️ Next.js Config
**File:** `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  /* config options here */
};
```

**Issue:** Config is empty. For production, consider adding:

```typescript
const nextConfig: NextConfig = {
  // Optimize images
  images: {
    unoptimized: false, // Enable image optimization
  },
  
  // Security headers (if not using Railway/Vercel middleware)
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
  ],
  
  // Compression
  compress: true,
  
  // Production optimizations
  productionBrowserSourceMaps: false, // Disable source maps in production
  swcMinify: true, // Use SWC for minification (faster)
};
```

**Recommendation:** Add these for production hardening.

---

## 2. Environment Variables

### ✅ Local Development (`.env.local`)

**Status:** ✅ All required variables present

| Variable | Value | Status |
|----------|-------|--------|
| `LOGTO_APP_ID` | ✅ Set | ✅ |
| `LOGTO_APP_SECRET` | ✅ Set | ✅ |
| `LOGTO_ENDPOINT` | ✅ Set (Railway) | ✅ |
| `LOGTO_BASE_URL` | ✅ Set | ✅ |
| `LOGTO_COOKIE_SECRET` | ✅ Set | ✅ |
| `LOGTO_API_RESOURCE` | ✅ Set | ✅ |
| `BACKEND_API_URL` | ✅ Set (localhost:8080) | ✅ |
| `NEXT_PUBLIC_BACKEND_API_URL` | ✅ Set | ✅ |
| `NEXT_PUBLIC_INTENTIONS_API_URL` | ✅ Set | ✅ |
| `NEXT_PUBLIC_PRODUCT_ID` | ✅ Set | ✅ |
| `CALCULATOR_API_URL` | ✅ Set (localhost:3002) | ✅ |
| `NODE_ENV` | ✅ development | ✅ |

**Notes:**
- Using Railway Logto instance (`https://logto-custom-production.up.railway.app`)
- Backend points to localhost:8080 (local development)
- Calculator API points to localhost:3002

### ⚠️ Production (`.env.production`)

**Status:** ⚠️ Needs configuration

```dotenv
# Variables de entorno para producción
# Copia este archivo y ajusta los valores según tu entorno de producción

# Logto Configuration (Producción)
LOGTO_APP_ID=your-production-app-id
LOGTO_APP_SECRET=your-production-app-secret
LOGTO_ENDPOINT=https://your-logto-instance.com
LOGTO_BASE_URL=https://your-domain.com
LOGTO_COOKIE_SECRET=your-production-cookie-secret-32-chars
LOGTO_API_RESOURCE=https://your-api.com

# Backend API
BACKEND_API_URL=https://your-backend-api.com

# Environment
NODE_ENV=production
```

**Issues:**
1. ❌ All values are placeholders
2. ❌ Missing `NEXT_PUBLIC_*` variables
3. ❌ Missing `CALCULATOR_API_URL`
4. ❌ Missing `NEXT_PUBLIC_PRODUCT_ID`
5. ❌ Missing `NEXT_PUBLIC_TERMS_URL`

**Action Required:** Fill in production values before deploying.

### 📋 Production Environment Checklist

Before deploying to production, you need:

```dotenv
# ── Logto (Auth) ───────────────────────────────────────────────────────────────
LOGTO_APP_ID=<production-app-id>
LOGTO_APP_SECRET=<production-app-secret>
LOGTO_ENDPOINT=https://logto-custom-production.up.railway.app  # or your Logto instance
LOGTO_BASE_URL=https://your-production-domain.com
LOGTO_COOKIE_SECRET=<generate-with-openssl-rand-hex-32>
LOGTO_API_RESOURCE=https://your-api.com

# ── Backend ────────────────────────────────────────────────────────────────────
BACKEND_API_URL=https://fondea-backend-production-e5f1.up.railway.app
NEXT_PUBLIC_BACKEND_API_URL=https://fondea-backend-production-e5f1.up.railway.app
NEXT_PUBLIC_INTENTIONS_API_URL=https://fondea-backend-production-e5f1.up.railway.app

# ── Calculadora (servidor separado) ───────────────────────────────────────────
CALCULATOR_API_URL=https://your-calculator-api.com
CALCULATOR_API_KEY=<your-api-key>

# ── Producto ───────────────────────────────────────────────────────────────────
NEXT_PUBLIC_PRODUCT_ID=550e8400-e29b-41d4-a716-446655440000

# ── Legal ──────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_TERMS_URL=https://your-domain.com/terminos-y-condiciones

# ── Environment ────────────────────────────────────────────────────────────────
NODE_ENV=production
```

---

## 3. Middleware Configuration

### ✅ Authentication Middleware (`middleware.ts`)

**Status:** ✅ Well-implemented

**What it does:**
1. ✅ Persists `intencionId` in httpOnly cookie (survives auth cycle)
2. ✅ Redirects unauthenticated users to `/api/logto/sign-in`
3. ✅ Passes `intencionId` through OIDC flow
4. ✅ Skips Logto routes and static assets
5. ✅ Uses secure cookies in production (`secure: NODE_ENV === 'production'`)

**Security notes:**
- ✅ httpOnly flag prevents XSS access
- ✅ sameSite: 'lax' prevents CSRF
- ✅ Secure flag enabled in production
- ✅ Cookie TTL: 1 hour (reasonable)

**No changes needed.**

---

## 4. Dependencies

### ✅ Production Dependencies

| Package | Version | Status | Notes |
|---------|---------|--------|-------|
| `next` | 16.2.4 | ✅ | Latest stable |
| `react` | 19.2.4 | ✅ | Latest stable |
| `react-dom` | 19.2.4 | ✅ | Matches React |
| `@logto/next` | 4.2.10 | ✅ | Auth SDK |
| `react-hook-form` | 7.73.1 | ✅ | Form handling |
| `zod` | 4.3.6 | ✅ | Schema validation |
| `tailwindcss` | 4 | ✅ | Latest |
| `lucide-react` | 1.9.0 | ✅ | Icons |
| `clsx` | 2.1.1 | ✅ | Class merging |

**Status:** ✅ All dependencies are up-to-date and stable.

### ✅ Dev Dependencies

| Package | Version | Status |
|---------|---------|--------|
| `typescript` | 5 | ✅ |
| `eslint` | 9 | ✅ |
| `tailwindcss` | 4 | ✅ |

**Status:** ✅ Development tools are current.

---

## 5. Build Process

### Build Command
```bash
npm run build
```

**What happens:**
1. TypeScript compilation (strict mode)
2. Next.js build with Turbopack
3. Tailwind CSS compilation
4. Static optimization
5. Output to `.next/` directory

### Start Command
```bash
npm start
```

**What happens:**
1. Starts Next.js production server
2. Serves optimized build from `.next/`
3. Listens on port 3000 (default)

**Status:** ✅ Standard Next.js build process. No issues.

---

## 6. Deployment Platforms

### Option 1: Railway (Recommended)

**Why:** Already using Railway for Logto and Backend.

**Setup:**
1. Connect GitHub repo to Railway
2. Set environment variables in Railway dashboard
3. Railway auto-detects Next.js and builds correctly
4. Deploys to `*.up.railway.app` domain

**Environment Variables in Railway:**
```
LOGTO_APP_ID=<value>
LOGTO_APP_SECRET=<value>
LOGTO_ENDPOINT=https://logto-custom-production.up.railway.app
LOGTO_BASE_URL=https://your-railway-domain.up.railway.app
LOGTO_COOKIE_SECRET=<value>
LOGTO_API_RESOURCE=https://your-api.com
BACKEND_API_URL=https://fondea-backend-production-e5f1.up.railway.app
NEXT_PUBLIC_BACKEND_API_URL=https://fondea-backend-production-e5f1.up.railway.app
NEXT_PUBLIC_INTENTIONS_API_URL=https://fondea-backend-production-e5f1.up.railway.app
CALCULATOR_API_URL=https://your-calculator-api.com
NEXT_PUBLIC_PRODUCT_ID=550e8400-e29b-41d4-a716-446655440000
NEXT_PUBLIC_TERMS_URL=https://your-domain.com/terminos-y-condiciones
NODE_ENV=production
```

### Option 2: Vercel

**Why:** Official Next.js hosting.

**Setup:**
1. Connect GitHub to Vercel
2. Vercel auto-detects Next.js
3. Set environment variables in Vercel dashboard
4. Deploys to `*.vercel.app` domain

**Note:** Vercel is free tier friendly but may have different pricing than Railway.

### Option 3: Docker (Self-hosted)

**If you want to self-host:**

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - LOGTO_APP_ID=${LOGTO_APP_ID}
      - LOGTO_APP_SECRET=${LOGTO_APP_SECRET}
      # ... other env vars
```

---

## 7. Security Checklist

### ✅ Environment Variables
- ✅ Secrets not committed (`.env*` in `.gitignore`)
- ✅ httpOnly cookies for auth tokens
- ✅ Secure flag in production
- ✅ LOGTO_COOKIE_SECRET is 32 chars

### ✅ Middleware
- ✅ CSRF protection (sameSite: 'lax')
- ✅ XSS protection (httpOnly cookies)
- ✅ Auth required for protected routes

### ⚠️ Recommended Additions
1. **Content Security Policy (CSP)** — Add to `next.config.ts`
2. **Rate limiting** — Consider for API routes
3. **CORS configuration** — If calling external APIs
4. **Helmet.js** — For additional security headers

---

## 8. Performance Checklist

### ✅ Current Setup
- ✅ Turbopack enabled (fast builds)
- ✅ SWC minification (fast)
- ✅ Tailwind v4 (optimized CSS)
- ✅ React 19 (latest optimizations)

### 📋 Recommended Optimizations
1. **Image Optimization** — Add to `next.config.ts`:
   ```typescript
   images: {
     unoptimized: false,
     formats: ['image/avif', 'image/webp'],
   }
   ```

2. **Font Optimization** — Use `next/font` for custom fonts

3. **Bundle Analysis** — Add `@next/bundle-analyzer`:
   ```bash
   npm install --save-dev @next/bundle-analyzer
   ```

4. **Caching Headers** — Configure in `next.config.ts` or Railway

---

## 9. Monitoring & Logging

### ✅ Current Setup
- ✅ Console logging in middleware
- ✅ Error boundaries in components

### 📋 Recommended Additions
1. **Error Tracking** — Sentry, LogRocket, or similar
2. **Performance Monitoring** — Web Vitals tracking
3. **Analytics** — Google Analytics or Plausible
4. **Logs Aggregation** — Railway provides logs dashboard

---

## 10. Deployment Checklist

### Before Deploying to Production

- [ ] Fill in all `.env.production` values
- [ ] Test build locally: `npm run build && npm start`
- [ ] Verify all API endpoints are production URLs
- [ ] Test authentication flow end-to-end
- [ ] Test calculator integration
- [ ] Verify LOGTO_API_RESOURCE matches backend audience
- [ ] Generate new LOGTO_COOKIE_SECRET: `openssl rand -hex 32`
- [ ] Set up monitoring/error tracking
- [ ] Configure custom domain (if not using Railway subdomain)
- [ ] Set up SSL/TLS (Railway handles this automatically)
- [ ] Test on production environment
- [ ] Set up backup/disaster recovery plan

### Deployment Steps (Railway)

1. **Connect Repository:**
   ```bash
   # In Railway dashboard: Connect GitHub repo
   ```

2. **Set Environment Variables:**
   - Go to Railway dashboard → Project → Variables
   - Add all production environment variables

3. **Deploy:**
   - Railway auto-deploys on push to main branch
   - Or manually trigger deploy in dashboard

4. **Verify:**
   - Check Railway logs for errors
   - Test app at `https://your-railway-domain.up.railway.app`

---

## 11. Summary

### ✅ What's Good
1. Build configuration is standard and correct
2. TypeScript strict mode enabled
3. Middleware properly handles auth flow
4. Dependencies are up-to-date
5. Environment variables well-organized
6. Security practices are solid

### ⚠️ What Needs Attention
1. **Production `.env.production` is empty** — Must fill before deploying
2. **`next.config.ts` is minimal** — Add security headers and optimizations
3. **No deployment platform configured** — Choose Railway, Vercel, or Docker

### 🚀 Next Steps
1. Fill in production environment variables
2. Add security headers to `next.config.ts`
3. Choose deployment platform (Railway recommended)
4. Test build locally
5. Deploy to production
6. Monitor logs and errors

---

## 12. Quick Reference

### Local Development
```bash
npm install
npm run dev
# App runs on http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
# App runs on http://localhost:3000
```

### Environment Variables
- **Local:** `.env.local` (already configured)
- **Production:** `.env.production` (needs configuration)
- **Example:** `.env.example` (reference)

### Key Files
- `next.config.ts` — Build configuration
- `tsconfig.json` — TypeScript configuration
- `postcss.config.mjs` — CSS pipeline
- `middleware.ts` — Auth middleware
- `package.json` — Dependencies and scripts

---

**Generated:** May 18, 2026  
**Status:** Ready for production deployment with configuration
