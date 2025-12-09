# Environment Variables for Azure Deployment

## Required Variables

These will be set when you deploy the container to Azure:

### 1. **OPENAI_API_KEY**
- **What**: Your OpenAI API key for GPT-4o Vision
- **Where to get**: https://platform.openai.com/api-keys
- **Format**: `sk-proj-xxxxxxxxxxxxxxxxxxxxx`
- **Used for**: Image analysis with AI

### 2. **ADMIN_USER**
- **What**: Login email for the application
- **Example**: `admin@hiranigroup.com` or `developer@hiranigroup.com`
- **Used for**: Authentication/login

### 3. **ADMIN_PASS**
- **What**: Login password for the application
- **Example**: Choose a strong password like `HiraniInspector2025!`
- **Security**: Use at least 12 characters with uppercase, lowercase, numbers, and symbols
- **Used for**: Authentication/login

### 4. **NODE_ENV**
- **What**: Application environment
- **Value**: `production` (already set in deployment command)
- **Used for**: Next.js optimization

---

## Deployment Command with Environment Variables

When you deploy, the command will look like this:

```bash
az container create \
  --resource-group hirani-image-analytics-rg \
  --name hirani-image-inspector \
  --image hiraniregistry.azurecr.io/hirani-image-analytics:latest \
  --registry-login-server hiraniregistry.azurecr.io \
  --registry-username hiraniregistry \
  --registry-password "orY9v4ta9uirPinoOfKeBksaOyXQ2CJPUbIjYXrKWc+ACRCe5AkR" \
  --dns-name-label hirani-inspector-$(date +%s) \
  --ports 3000 \
  --cpu 1 \
  --memory 2 \
  --location eastus \
  --restart-policy Always \
  --environment-variables \
    NODE_ENV=production \
  --secure-environment-variables \
    OPENAI_API_KEY="sk-YOUR-OPENAI-KEY-HERE" \
    ADMIN_USER="admin@hiranigroup.com" \
    ADMIN_PASS="YourStrongPassword123!"
```

---

## Where to Get Your OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign in to your OpenAI account
3. Click **"Create new secret key"**
4. Name it: `Hirani Image Analytics`
5. Copy the key (starts with `sk-proj-...`)
6. **Save it immediately** - you won't see it again!

---

## Important Security Notes

⚠️ **NEVER commit API keys or passwords to Git**

✅ **Secure environment variables** are used in Azure (encrypted)

✅ **Change the default password** after first deployment

✅ **Rotate keys periodically** for security

---

## Testing Your Deployment

After deployment, you'll login with:
- **Email**: Whatever you set for `ADMIN_USER`
- **Password**: Whatever you set for `ADMIN_PASS`

Example:
```
Email: admin@hiranigroup.com
Password: HiraniInspector2025!
```

---

## Environment Variables Are:

- ✅ Set during container creation
- ✅ Encrypted when using `--secure-environment-variables`
- ✅ Accessible to the application at runtime
- ✅ NOT stored in your codebase
- ✅ Can be updated by redeploying the container

---

## Quick Checklist

Before deployment, have ready:

- [ ] OpenAI API Key (`sk-proj-...`)
- [ ] Admin email (e.g., `admin@hiranigroup.com`)
- [ ] Strong password (12+ characters)
- [ ] ACR password (already saved: `orY9v4ta9uirPinoOfKeBksaOyXQ2CJPUbIjYXrKWc+ACRCe5AkR`)

---

**Next Step**: Once Docker build completes, we'll push the image and deploy with these environment variables!
