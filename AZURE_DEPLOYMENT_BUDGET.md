# Azure Deployment - Budget Optimized (Under $50/month)

**Target**: Keep total costs under $50/month  
**Usage Pattern**: 2-3 hours daily on weekdays, minimal weekend usage  
**Strategy**: Pay-per-use + auto-shutdown + reduced resources

---

## 💰 Cost Breakdown Analysis

### Current High-Cost Setup (~$102/month)
```
Azure Container Instances (24/7):
- CPU (2 vCPU, 24/7):        $63/month
- Memory (4GB, 24/7):         $14/month
- Container Registry:         $5/month
- OpenAI (1000 images):       $20/month
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                        $102/month ❌
```

### Optimized Setup - 24/7 Operation (~$45/month) ⚠️
```
Azure Container Instances (24/7, 720 hrs):
- CPU (1 vCPU, 24/7):         $22.55/month
- Memory (2GB, 24/7):         $6.37/month
- Container Registry:         $5/month
- OpenAI (800 images max):    $16/month
- Buffer:                     $0.08/month
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                        $50.00/month ⚠️
TRADE-OFF:                    Always available, but less OpenAI budget
```

**Key Difference**: 24/7 availability means higher fixed costs ($33.92) but instant access. Budget mainly consumed by infrastructure, leaving ~$16/month for OpenAI (~800 images).

---

## 🎯 Budget-Optimized Deployment Strategy

### Key Changes:
1. **24/7 availability** (always running, no manual start/stop)
2. **Reduced resources** (1 vCPU, 2GB RAM for light usage)
3. **Keep Container Registry** (only $5/month, saves rebuild time)
4. **Optimized configuration** (minimal resources while maintaining performance)

---

## 🚀 Deployment Steps (Budget Version)

### Step 1-6: Same as Original Guide
Follow steps 1-6 from `AZURE_DEPLOYMENT.md`:
- Install Azure CLI
- Create Resource Group
- Create Container Registry
- Build & Push Docker Image

---

### Step 7: Deploy with Reduced Resources

**Deploy container with cost-optimized settings**:

```bash
az container create \
  --resource-group hirani-image-analytics-rg \
  --name hirani-image-inspector \
  --image hiraniregistry.azurecr.io/hirani-image-analytics:latest \
  --registry-login-server hiraniregistry.azurecr.io \
  --registry-username hiraniregistry \
  --registry-password "YOUR_ACR_PASSWORD_FROM_STEP_4" \
  --dns-name-label hirani-inspector-unique \
  --ports 3000 \
  --cpu 1 \
  --memory 2 \
  --location eastus \
  --restart-policy Always \
  --environment-variables \
    NODE_ENV=production \
    NEXT_PUBLIC_URL=http://hirani-inspector-unique.eastus.azurecontainer.io \
  --secure-environment-variables \
    OPENAI_API_KEY="sk-your-openai-key" \
    ADMIN_USER="admin@yourcompany.com" \
    ADMIN_PASS="YourSecurePassword123!"
```

**Key Configuration**:
- `--cpu 1` (instead of 2) → 50% CPU cost reduction while maintaining performance
- `--memory 2` (instead of 4) → 50% RAM cost reduction
- `--restart-policy Always` → Auto-restarts on failure, ensures 24/7 availability

**Performance Impact**:
- ✅ Always available - no startup time needed
- ✅ Still handles 5-10 concurrent image analyses
- ✅ Sufficient for 1-2 users at a time
- ⚠️ Slower for batch processing (500+ images)

---

## 🌐 24/7 Access

**Your app is always available at**:
```
http://hirani-inspector-unique.eastus.azurecontainer.io:3000
```

**Check container status**:
```bash
az container show \
  --resource-group hirani-image-analytics-rg \
  --name hirani-image-inspector \
  --query "containers[0].instanceView.currentState.state" \
  --output tsv
```

Output should always be: `Running`

**View logs** (if you need to troubleshoot):
```bash
az container logs \
  --resource-group hirani-image-analytics-rg \
  --name hirani-image-inspector \
  --follow
```

**Restart container** (if needed):
```bash
az container restart \
  --resource-group hirani-image-analytics-rg \
  --name hirani-image-inspector
```

---

## 📊 Cost Monitoring

### Check Current Month's Usage

**Get container CPU usage**:
```bash
az monitor metrics list \
  --resource "/subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/hirani-image-analytics-rg/providers/Microsoft.ContainerInstance/containerGroups/hirani-image-inspector" \
  --metric "CpuUsage" \
  --start-time $(date -u -v-30d +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --interval PT1H \
  --output table
```

**Note**: Container runs 24/7 = 720 hours/month

### Set Up Billing Alert

**Create budget alert** (warns at $50):
```bash
# Create budget
az consumption budget create \
  --budget-name hirani-app-budget \
  --amount 50 \
  --category Cost \
  --time-grain Monthly \
  --start-date $(date +%Y-%m-01) \
  --resource-group hirani-image-analytics-rg
```

**Email alert at 100% ($50)**:
```bash
az monitor action-group create \
  --name BudgetAlert \
  --resource-group hirani-image-analytics-rg \
  --short-name BudgetAlrt \
  --email-receiver name=admin email=admin@yourcompany.com
```

---

## 💡 Additional Cost-Saving Tips

### 1. Optimize OpenAI Usage

**Reduce GPT-4o costs**:
- Use `max_tokens: 200` instead of 300 → Save 33%
- Batch similar images → Reuse context
- Cache repeated analyses

Update in `src/app/api/analyze/route.ts`:
```typescript
max_tokens: 200,  // Reduced from 300
```

**Estimated savings**: $5-7/month

---

### 2. Monitor Image Analysis Frequency

**Track OpenAI usage**:
```bash
# Check logs for cost analysis
az container logs \
  --resource-group hirani-image-analytics-rg \
  --name hirani-image-inspector | grep "costUsd"
```

**Tip**: Batch similar images together to optimize OpenAI costs

---

## 📈 Usage Scenarios & Costs (24/7 Operation)

### Base Infrastructure Cost (Fixed)
```
Container (24/7, 720 hrs):   $22.55/month (1 vCPU)
Memory (24/7, 2GB):          $6.37/month
Container Registry:          $5.00/month
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fixed Infrastructure:        $33.92/month
```

### Scenario 1: Light Usage (Under Budget ✅)
```
Fixed Infrastructure:    $33.92/month
OpenAI (200 images):     $4.00/month
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                   $37.92/month ✅
Buffer remaining:        $12.08
```

### Scenario 2: Moderate Usage (Under Budget ✅)
```
Fixed Infrastructure:    $33.92/month
OpenAI (400 images):     $8.00/month
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                   $41.92/month ✅
Buffer remaining:        $8.08
```

### Scenario 3: Maximum Safe Usage (At Budget Limit ⚠️)
```
Fixed Infrastructure:    $33.92/month
OpenAI (800 images):     $16.00/month
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                   $49.92/month ⚠️
At budget limit!
```

### ⚠️ Scenario 4: Over Budget (❌)
```
Fixed Infrastructure:    $33.92/month
OpenAI (1000 images):    $20.00/month
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                   $53.92/month ❌
OVER BUDGET by $3.92
```

**Key Insight**: With 24/7 operation, stay under $50/month by limiting OpenAI usage to ~800 images/month

---

## 🚨 Cost Overrun Prevention

### Automatic Safeguards

**1. Monitor OpenAI usage** (primary variable cost):
```bash
# Check daily image analysis count
az container logs \
  --resource-group hirani-image-analytics-rg \
  --name hirani-image-inspector | grep "Analysis complete" | wc -l
```

**2. Cost alert script** `check-costs.sh`:
```bash
#!/bin/bash
CURRENT_COST=$(az consumption usage list \
  --start-date $(date -v-30d +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  --query "[?contains(instanceName, 'hirani')].{cost:pretaxCost}" \
  --output tsv | awk '{s+=$1} END {print s}')

echo "Current month cost: $${CURRENT_COST}"

if (( $(echo "$CURRENT_COST > 45" | bc -l) )); then
  echo "⚠️  WARNING: Approaching budget limit!"
  echo "Consider reducing usage this month."
fi
```

Run weekly:
```bash
chmod +x check-costs.sh
./check-costs.sh
```

---

## 📋 Cost Optimization Checklist

**Daily**:
- [ ] Container runs automatically (no action needed)
- [ ] Monitor if anyone is actively using the app
- [ ] Track number of images analyzed

**Weekly**:
- [ ] Run cost check: `./check-costs.sh`
- [ ] Review OpenAI usage in logs
- [ ] Verify container health: `az container show`

**Monthly**:
- [ ] Review Azure billing dashboard
- [ ] Count total images analyzed (aim for <800/month)
- [ ] Check if $50 budget is sufficient or needs adjustment
- [ ] Optimize GPT-4o prompts if costs are high

---

## 🔧 Troubleshooting Cost Issues

### Issue: Bill is higher than expected

**Check total costs**:
```bash
az consumption usage list \
  --start-date $(date -v-30d +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  --output table
```

**Common causes**:
- ❌ Too many images analyzed (OpenAI costs)
- ❌ Container using more resources than expected
- ❌ Unexpected Azure charges

**Solution**: Review OpenAI usage
```bash
az container logs \
  --resource-group hirani-image-analytics-rg \
  --name hirani-image-inspector | grep "costUsd" | tail -20
```

---

### Issue: OpenAI costs too high

**Check token usage** in logs:
```bash
az container logs \
  --resource-group hirani-image-analytics-rg \
  --name hirani-image-inspector | grep "costUsd"
```

**Reduce costs**:
1. Lower `max_tokens` from 300 → 150
2. Analyze fewer images per session
3. Reuse analysis for similar images

---

## 💻 Quick Reference Commands

```bash
# CHECK STATUS (should always be "Running")
az container show --resource-group hirani-image-analytics-rg --name hirani-image-inspector --query "containers[0].instanceView.currentState.state" -o tsv

# VIEW LOGS
az container logs --resource-group hirani-image-analytics-rg --name hirani-image-inspector --follow

# RESTART CONTAINER (if needed)
az container restart --resource-group hirani-image-analytics-rg --name hirani-image-inspector

# CHECK COST (approximate)
az consumption usage list --start-date $(date -v-30d +%Y-%m-%d) --end-date $(date +%Y-%m-%d) --output table

# COUNT IMAGES ANALYZED TODAY
az container logs --resource-group hirani-image-analytics-rg --name hirani-image-inspector | grep "Analysis complete" | grep "$(date +%Y-%m-%d)" | wc -l
```

---

## 📊 Real Cost Calculation (24/7)

**Per-second pricing**:
- 1 vCPU: $0.0000061/second
- 2GB RAM: $0.0000026/second
- **Combined**: $0.0000087/second

**Hourly cost**: $0.03132/hour  
**Daily cost (24 hours)**: $0.752/day  
**Monthly cost (720 hours)**: $22.55/month (CPU) + $6.37/month (RAM) = **$28.92/month**

**Infrastructure baseline**: $5 (registry) + $28.92 (container) = **$33.92/month**  
**Remaining for OpenAI**: $50 - $33.92 = **$16.08/month** (≈800 images)

---

## 🎯 Final Recommendation (24/7 Operation)

**Best Setup for Your Usage**:
```
✅ Use 1 vCPU, 2GB RAM (sufficient for 2-3 users)
✅ Always-on availability (no startup delays)
✅ Auto-restart on failures
✅ Set billing alert at $50
✅ Monitor OpenAI usage weekly
✅ Limit to ~800 images/month to stay under budget

Fixed Infrastructure Cost: $33.92/month
Available for OpenAI: $16.08/month (~800 images)
Expected Total Cost: $40-50/month
```

**Budget Management**: Since container runs 24/7, your main variable cost is OpenAI. Monitor image analysis count to stay under $50/month!

---

## 🚀 One-Command Budget Deployment (24/7)

```bash
# Deploy with 24/7 availability
az container create \
  --resource-group hirani-image-analytics-rg \
  --name hirani-image-inspector \
  --image hiraniregistry.azurecr.io/hirani-image-analytics:latest \
  --registry-login-server hiraniregistry.azurecr.io \
  --registry-username hiraniregistry \
  --registry-password "YOUR_ACR_PASSWORD" \
  --dns-name-label hirani-inspector-unique \
  --ports 3000 \
  --cpu 1 \
  --memory 2 \
  --location eastus \
  --restart-policy Always \
  --environment-variables NODE_ENV=production NEXT_PUBLIC_URL=http://hirani-inspector-unique.eastus.azurecontainer.io \
  --secure-environment-variables OPENAI_API_KEY="sk-your-key" ADMIN_USER="admin@company.com" ADMIN_PASS="YourPassword"
```

---

## ✅ Summary (24/7 Operation)

**You'll stay under $50/month by**:
1. Using optimized container (1 vCPU, 2GB) → Minimal infrastructure cost
2. Running 24/7 for instant availability → No startup delays
3. Limiting OpenAI usage to ~800 images/month → Main cost control
4. Setting up billing alerts at $50 → Budget limit notification

**Cost breakdown**:
- Fixed infrastructure: $33.92/month (always running)
- Variable OpenAI: $4-16/month (depending on usage)
- **Expected total**: $38-50/month

**Budget compliance**: ⚠️ Achievable with OpenAI usage discipline

**Remember**: With 24/7 operation, **controlling OpenAI image analysis** is your key to staying under budget. Limit to ~800 images/month! 🎯
