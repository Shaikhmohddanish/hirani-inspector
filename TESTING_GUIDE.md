# Testing Guide: Report Generation Fix

## Quick Test Instructions

### Prerequisites
✅ Ensure you have 114 images ready to upload
✅ Verify Cloudinary credentials are configured in `.env.local`
✅ Application is running locally or deployed to Vercel

### Test Steps

#### 1. Upload Images (Already Working)
```
1. Click "Load Images" button
2. Select all 114 images
3. Wait for upload progress
4. Verify: "Successfully uploaded 114 images" in log terminal
```

#### 2. Analyze Images (Already Working)
```
1. Click "Start GPT Analysis"
2. Wait for batch analysis to complete
3. Verify: "114 images | 114 analyzed | 0 pending" in header
```

#### 3. Test Normal Report Generation (THIS IS THE FIX)
```
1. Click "Generate Normal Report" button
2. Expected behavior:
   ✅ Log shows: "Sending request with 114 image IDs (payload: ~4000 bytes)"
   ✅ No "Request Entity Too Large" error
   ✅ Log shows: "Downloading generated report..."
   ✅ File downloads automatically: "inspection-report-YYYY-MM-DD.docx"
   ✅ Log shows: "✅ Normal report saved: inspection-report-YYYY-MM-DD.docx (X.XX MB)"
   
3. Open the downloaded .docx file
4. Verify:
   ✅ All 114 images are present
   ✅ Each image has its comment/assessment
   ✅ Images are properly formatted
```

#### 4. Test Modified Report Generation (THIS IS THE FIX)
```
1. Click "Generate Modified Report" button
2. Expected behavior:
   ✅ Log shows: "Sending request with 114 image IDs (payload: ~4000 bytes)"
   ✅ No "Request Entity Too Large" error
   ✅ Log shows: "Downloading generated report..."
   ✅ File downloads automatically: "inspection-report-annotated-YYYY-MM-DD.docx"
   ✅ Log shows: "✅ Modified report saved: inspection-report-annotated-YYYY-MM-DD.docx (X.XX MB)"
   
3. Open the downloaded .docx file
4. Verify:
   ✅ All 114 images are present (with annotations if any)
   ✅ Each image has its comment/assessment
   ✅ Annotated images show bounding boxes (if drawn)
```

### Success Criteria

✅ **Primary Goal**: No "Request Entity Too Large" error with 114 images
✅ **Secondary Goal**: Reports generate and download successfully
✅ **Tertiary Goal**: Reports contain all 114 images with proper data

### What to Check in Browser Console

Expected logs during report generation:
```javascript
[Normal Report] Request received
[Normal Report] Using imageIds format with 114 IDs
[Normal Report] Generating report for 114 images...
[Normal Report] Using string[] format - fetching 114 images from storage
[Normal Report] Fetched metadata: 114 found, 0 missing
[Normal Report] Report generated successfully: 2458624 bytes
```

### Common Issues & Solutions

#### Issue: "No metadata found for <uuid>"
**Cause**: Images uploaded but metadata not saved after analysis
**Solution**: 
1. Re-analyze the images
2. Check that analysis completes successfully
3. Metadata is auto-saved after each analysis

#### Issue: "Image <id> not found in store"
**Cause**: Images not uploaded to Cloudinary
**Solution**: 
1. Re-upload images using "Load Images" button
2. Wait for "Successfully uploaded X images" confirmation

#### Issue: Report is slow to generate
**Expected**: 114 images may take 30-60 seconds to generate
**Normal**: Vercel function has 5-minute timeout (maxDuration: 300)

### Performance Benchmarks

| Images | Old Payload | New Payload | Reduction |
|--------|-------------|-------------|-----------|
| 10     | ~1-2 MB     | ~400 bytes  | 99.9%     |
| 50     | ~5-10 MB    | ~2 KB       | 99.9%     |
| 114    | ~10-20 MB ❌ | ~4 KB ✅    | 99.9%     |
| 500    | ~50-100 MB ❌ | ~18 KB ✅   | 99.9%     |

### Edge Cases to Test

1. **Empty report** (0 images)
   - Should show error: "No images provided"

2. **Small report** (1-5 images)
   - Should work without warnings
   - Quick generation (<5 seconds)

3. **Large report** (200+ images)
   - Should show warning dialog
   - Should complete within 5 minutes

4. **Very large report** (500+ images)
   - Should show warning dialog
   - May take 2-3 minutes
   - Should still work (no payload limit)

### Monitoring in Production

Check Vercel logs for:
```
[Normal Report] Using imageIds format with 114 IDs
[Normal Report] Fetched metadata: 114 found, 0 missing
[Normal Report] Report generated successfully: 2458624 bytes
```

Watch for errors:
```
⚠️ [Normal Report] No metadata found for <uuid>
[Normal Report] Error generating report: <error>
```

## Rollback Instructions

If the fix causes issues, rollback by:

1. Open `src/components/unified/UnifiedInspectorPanel.tsx`
2. Find `handleGenerateNormal` and `handleGenerateModified`
3. Replace `imageIds` with full `reportData` (see FIX_SUMMARY.md)
4. Redeploy

**Note**: Rollback will re-introduce the payload limit for >50 images.

## Next Steps After Testing

If all tests pass:
- ✅ Deploy to production
- ✅ Monitor Vercel logs for 24 hours
- ✅ Mark issue as resolved

If tests fail:
- ❌ Check browser console for errors
- ❌ Check Vercel function logs
- ❌ Verify Cloudinary credentials
- ❌ Contact support with error details
