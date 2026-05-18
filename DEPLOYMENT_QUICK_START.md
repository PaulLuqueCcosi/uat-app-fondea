# Deployment Quick Start Guide

**Status:** ✅ Ready to deploy  
**Build:** Successful (all tests pass)  
**Last Updated:** May 18, 2026

---

## 1. Local Testing (5 minutes)

```bash
# Install dependencies (if not already done)
npm install

# Build the project
npm run build

# Start production server
npm start

# App runs on http://localhost:3000
```

**Expected output:**
```
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages
```

---

## 2. Environment Setup (10 minutes)

### Copy production template
```bash
cp .env.production .env.production.local
```

### Fill in values
Edit `.env.production.local` with:

```dotenv
# ── Logto (Auth) ───────────────────────────────────────────────────────────────
LOGTO_APP_ID=<get-from-logto-dashboard>
LOGTO_APP_SECRET=<get-from-logto-dashboard>
LOGTO_ENDPOINT=https://logto-custom-production.up.railway.app
LOGTO_BASE_URL=https://your-production-domain.com
LOGTO_COOKIE_SECRET=<generate-with-openssl-rand-hex-32>
LOGTO_API_RESOURCE=https://your-api.com

# ── Backend API ────────────────────────────────────────────────────────────────
BACKEND_API_URL=https://fondea-backend-production-e5f1.up.railway.app
NEXT_PUBLIC_BACKEND_API_URL=https://fondea-backend-production-e5f1.up.railway.app
NEXT_PUBLIC_INTENTIONS_API_URL=https://fondea-backend-production-e5f1.up.railway.app

# ── Calculadora ────────────────────────────────────────────────────────────────
CALCULATOR_API_URL=https://your-calculator-api.com
CALCULATOR_API_KEY=<your-api-key>

# ── Producto ───────────────────────────────────────────────────────────────────
NEXT_PUBLIC_PRODUCT_ID=550e8400-e29b-41d4-a716-446655440000

# ── Legal ──────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_TERMS_URL=https://your-domain.com/terminos-y-condiciones

# ── Environment ────────────────────────────────────────────────────────────────
NODE_ENV=production
```

### Generate LOGTO_COOKIE_SECRET
```bash
# macOS/Linux
openssl rand -hex 32

# Windows (PowerShell)
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

---

## 3. Deploy to Railway (5 minutes)

### Step 1: Connect Repository
1. Go to [Railway Dashboard](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account
5. Select this repository

### Step 2: Set Environment Variables
1. In Railway dashboard → Project → Variables
2. Add all variables from `.env.production.local`
3. Click "Save"

### Step 3: Deploy
1. Railway auto-detects Next.js
2. Auto-builds and deploys on push to main branch
3. Or manually trigger deploy in dashboard

### Step 4: Verify
1. Check Railway logs for errors
2. Visit your Railway domain (e.g., `https://your-app.up.railway.app`)
3. Test login flow
4. Test calculator

---

## 4. Post-Deployment Checklist

- [ ] App loads without errors
- [ ] Login works
- [ ] Calculator works
- [ ] API calls succeed
- [ ] No console errors
- [ ] Security headers present
- [ ] HTTPS enabled
- [ ] Custom domain configured (if applicable)

---

## 5. Monitoring

### View Logs
```bash
# Railway CLI
railway logs

# Or in Railway dashboard → Logs tab
```

### Common Issues

**Issue:** 500 error on login
- Check `LOGTO_API_RESOURCE` matches backend audience
- Verify `LOGTO_ENDPOINT` is accessible

**Issue:** Calculator not working
- Check `CALCULATOR_API_URL` is correct
- Verify `NEXT_PUBLIC_PRODUCT_ID` exists

**Issue:** Slow performance
- Check Railway CPU/Memory usage
- Consider upgrading plan

---

## 6. Rollback

If something goes wrong:

```bash
# Railway automatically keeps previous deployments
# In Railway dashboard → Deployments → Select previous → Redeploy
```

---

## 7. Custom Domain (Optional)

1. In Railway dashboard → Project → Settings
2. Add custom domain
3. Update DNS records (CNAME)
4. Wait for SSL certificate (auto)

---

## 8. Scaling (Future)

If you need more resources:

1. In Railway dashboard → Project → Settings
2. Upgrade plan or add more resources
3. Railway auto-scales

---

## 9. Backup & Disaster Recovery

### Database Backups
- Railway provides automated backups
- Check Railway dashboard for backup settings

### Code Backups
- GitHub is your backup
- All code is version controlled

---

## 10. Support

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Railway Docs](https://docs.railway.app)
- [Logto Docs](https://docs.logto.io)

### Troubleshooting
1. Check Railway logs
2. Check browser console
3. Check network tab
4. Review error messages

---

## Quick Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Check types
npx tsc --noEmit
```

---

## Environment Variables Reference

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `LOGTO_APP_ID` | ✅ | `abc123` | From Logto dashboard |
| `LOGTO_APP_SECRET` | ✅ | `secret123` | From Logto dashboard |
| `LOGTO_ENDPOINT` | ✅ | `https://logto.example.com` | Your Logto instance |
| `LOGTO_BASE_URL` | ✅ | `https://app.example.com` | Your app domain |
| `LOGTO_COOKIE_SECRET` | ✅ | `<32-char-hex>` | Generate with openssl |
| `LOGTO_API_RESOURCE` | ✅ | `https://api.example.com` | Must match backend |
| `BACKEND_API_URL` | ✅ | `https://api.example.com` | Backend URL |
| `NEXT_PUBLIC_BACKEND_API_URL` | ✅ | `https://api.example.com` | Public backend URL |
| `NEXT_PUBLIC_INTENTIONS_API_URL` | ✅ | `https://api.example.com` | Intentions API |
| `CALCULATOR_API_URL` | ✅ | `https://calc.example.com` | Calculator API |
| `NEXT_PUBLIC_PRODUCT_ID` | ✅ | `550e8400-...` | Product UUID |
| `NEXT_PUBLIC_TERMS_URL` | ✅ | `https://example.com/terms` | Terms page |
| `NODE_ENV` | ✅ | `production` | Always `production` |

---

## Deployment Timeline

| Step | Time | Status |
|------|------|--------|
| Local build test | 5 min | ✅ |
| Environment setup | 10 min | ✅ |
| Railway deployment | 5 min | ✅ |
| Verification | 5 min | ✅ |
| **Total** | **25 min** | **✅** |

---

## Success Criteria

✅ App loads without errors  
✅ Login works end-to-end  
✅ Calculator works  
✅ API calls succeed  
✅ No console errors  
✅ HTTPS enabled  
✅ Security headers present  

---

**Ready to deploy!** 🚀

For detailed information, see:
- `BUILD_AND_DEPLOYMENT_REVIEW.md` — Comprehensive review
- `BUILD_FIXES_SUMMARY.md` — All fixes applied
- `.env.production` — Environment template
