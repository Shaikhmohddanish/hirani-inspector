# Vercel Deployment Checklist

## Environment Variables to Add in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

```
ADMIN_USER=admin@hiranigroup.com
ADMIN_PASS=Aa112233@

OPENAI_API_KEY=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

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dczjkkzl5
CLOUDINARY_CLOUD_NAME=dczjkkzl5
CLOUDINARY_API_KEY=716482934288956
CLOUDINARY_API_SECRET=1sm0yuFJicaA4vefU-YtBuUS9mw
```

## Steps to Fix 500 Error:

1. **Add Environment Variables** (most likely cause)
   - Cloudinary credentials missing in Vercel
   - Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables above
   - Redeploy

2. **Check Vercel Logs**
   - Go to: Vercel Dashboard → Your Project → Deployments → Latest
   - Click on deployment → Runtime Logs
   - Look for Cloudinary error messages

3. **Verify Cloudinary Account**
   - Make sure your Cloudinary account is active
   - Check quota limits

## After Adding Environment Variables:

1. Trigger a new deployment (or redeploy)
2. Test image upload
3. Check logs for "Successfully uploaded" messages

## If Still Failing:

Check these in Vercel logs:
- "Cloudinary config:" - Should show cloud_name and has_api_key: true
- Any "Cloudinary upload error:" messages
- Network/firewall issues blocking Cloudinary API
