# API Reference - Hirani Inspector

Complete API documentation for all endpoints in the Hirani Inspector application.

---

## 📚 Table of Contents

1. [Authentication](#authentication)
2. [Image Management](#image-management)
3. [Analysis](#analysis)
4. [Reports](#reports)
5. [Cleanup](#cleanup)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication

### POST `/api/auth/logout`

Destroys the user session and redirects to login page.

**Authentication**: Required (session cookie)

**Request**:
```http
POST /api/auth/logout
```

**Response**:
```
302 Redirect to /login
Set-Cookie: gak_inspector_session=; Max-Age=0
```

**Example**:
```typescript
// Client-side
await fetch('/api/auth/logout', { method: 'POST' });
// Redirects to /login
```

---

## 🖼️ Image Management

### GET `/api/images/[id]`

Retrieves an image or its metadata from Cloudinary storage.

**Authentication**: Required

**URL Parameters**:
- `id` (string, required): Image UUID

**Query Parameters**:
- None (automatically detects request type)

**Response**:
- Returns image buffer with appropriate content-type
- OR returns metadata JSON if requested

**Example**:
```typescript
// Fetch image
const response = await fetch('/api/images/abc-123');
const blob = await response.blob();
const imageUrl = URL.createObjectURL(blob);

// Display in img tag
<img src={imageUrl} alt="Inspection" />
```

---

### POST `/api/images/[id]`

Uploads an image or stores metadata for an existing image.

**Authentication**: Required

**URL Parameters**:
- `id` (string, required): Image UUID

**Request Body** (Image Upload):
```json
{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Request Body** (Metadata Storage):
```json
{
  "id": "abc-123",
  "name": "building-front.jpg",
  "comment": "Minor cracks visible in upper left corner",
  "environment": "outdoor",
  "annotations": [
    {
      "coordinates": [100, 150, 300, 400],
      "label": "Crack"
    }
  ],
  "status": "completed",
  "size": 1234567,
  "uploadedAt": "2026-02-10T17:00:00.000Z"
}
```

**Response** (Upload):
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/..."
}
```

**Response** (Metadata):
```json
{
  "success": true
}
```

**Example**:
```typescript
// Upload image
const response = await fetch('/api/images/abc-123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageData: base64Image })
});

// Store metadata
await fetch('/api/images/abc-123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'abc-123',
    name: 'building.jpg',
    comment: 'No defects found',
    environment: 'indoor',
    annotations: [],
    status: 'completed'
  })
});
```

**Error Responses**:
```json
// 400 Bad Request
{
  "error": "Image data or metadata required"
}

// 500 Internal Server Error
{
  "error": "Upload failed: <details>"
}
```

---

### DELETE `/api/images/[id]`

Deletes an image and its annotated version from Cloudinary.

**Authentication**: Required

**URL Parameters**:
- `id` (string, required): Image UUID

**Response**:
```json
{
  "success": true
}
```

**Example**:
```typescript
const response = await fetch('/api/images/abc-123', {
  method: 'DELETE'
});
const result = await response.json();
// { success: true }
```

**Error Responses**:
```json
// 500 Internal Server Error
{
  "error": "Deletion failed: <details>"
}
```

---

### POST `/api/images/[id]/annotated`

Generates an annotated version of an image with bounding boxes.

**Authentication**: Required

**URL Parameters**:
- `id` (string, required): Image UUID

**Request Body**:
```json
{
  "annotations": [
    {
      "coordinates": [100, 150, 300, 400],
      "label": "Crack in wall"
    },
    {
      "coordinates": [500, 200, 700, 450],
      "label": "Water damage"
    }
  ]
}
```

**Coordinates Format**: `[x1, y1, x2, y2]`
- `x1, y1`: Top-left corner
- `x2, y2`: Bottom-right corner
- Values in pixels relative to original image dimensions

**Response**:
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/.../abc-123_annotated"
}
```

**Annotation Style**:
- **Color**: Yellow (#FFD700)
- **Stroke Width**: 6px
- **Fill**: None (transparent)
- **Label**: Displayed above box

**Example**:
```typescript
const response = await fetch('/api/images/abc-123/annotated', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    annotations: [
      {
        coordinates: [100, 100, 300, 300],
        label: 'Crack'
      }
    ]
  })
});
```

**Error Responses**:
```json
// 400 Bad Request
{
  "error": "Annotations are required"
}

// 500 Internal Server Error
{
  "error": "Failed to generate annotated image: <details>"
}
```

---

### DELETE `/api/images/cleanup`

Deletes all images from the Cloudinary storage folder.

**Authentication**: Required

**Request**:
```http
DELETE /api/images/cleanup
```

**Response**:
```json
{
  "success": true,
  "deleted": 114,
  "errors": 0
}
```

**Example**:
```typescript
const response = await fetch('/api/images/cleanup', {
  method: 'DELETE'
});
const result = await response.json();
// { success: true, deleted: 114, errors: 0 }
```

**Error Responses**:
```json
// 500 Internal Server Error
{
  "error": "Cleanup failed: <details>"
}
```

---

## 🤖 Analysis

### POST `/api/analyze`

Analyzes an image using OpenAI GPT-4o Vision API to detect structural defects.

**Authentication**: Required

**Request Body**:
```json
{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "customPrompt": "optional-custom-prompt-id"
}
```

**Custom Prompt Options**:
- `undefined` or `null`: Uses default prompt
- `"gpt"`: Uses GPT-optimized prompt variant

**Response**:
```json
{
  "comment": "Minor cracks visible in the upper left corner. Paint shows signs of peeling near the window frame. Overall structural integrity appears sound.",
  "environment": "outdoor",
  "tokens": {
    "prompt": 1245,
    "completion": 87,
    "total": 1332
  },
  "cost": 0.0475
}
```

**Cost Calculation**:
- Input tokens: $0.005 per 1K tokens
- Output tokens: $0.015 per 1K tokens
- Formula: `(promptTokens / 1000 * 0.005) + (completionTokens / 1000 * 0.015)`

**Detection Capabilities**:
The AI analyzes images for:
- Cracks in concrete, walls, or structures
- Peeling or damaged paint
- Water damage and staining
- Concrete honeycombing
- Spalling and deterioration
- General structural issues

**Environment Classification**:
- `"indoor"`: Interior spaces
- `"outdoor"`: Exterior structures
- `"unknown"`: Unable to determine

**Example**:
```typescript
// Convert image to base64
const base64 = await imageToBase64(file);

// Analyze
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageData: base64,
    customPrompt: null // Use default prompt
  })
});

const result = await response.json();
console.log(result.comment); // "Minor cracks visible..."
console.log(result.cost);    // 0.0475
```

**Error Responses**:
```json
// 400 Bad Request
{
  "error": "Image data is required"
}

// 500 Internal Server Error
{
  "error": "Analysis failed: <details>"
}

// 401 Unauthorized (OpenAI)
{
  "error": "OpenAI API authentication failed"
}

// 429 Too Many Requests (OpenAI)
{
  "error": "Rate limit exceeded. Please try again later."
}
```

**Rate Limiting**:
- OpenAI enforces rate limits per API key
- Recommended: Add delay between batch requests (500ms - 2000ms)
- Monitor costs to avoid unexpected charges

---

## 📄 Reports

### POST `/api/reports/normal`

Generates a DOCX report with original images and analysis comments.

**Authentication**: Required

**Request Body**:
```json
{
  "imageIds": [
    "abc-123",
    "def-456",
    "ghi-789"
  ]
}
```

**Alternative Format** (Backward Compatible):
```json
{
  "images": [
    {
      "id": "abc-123",
      "name": "building-front.jpg",
      "comment": "Minor cracks visible",
      "environment": "outdoor",
      "annotations": [],
      "dataUrl": "data:image/jpeg;base64,..."
    }
  ]
}
```

**Note**: Using `imageIds` format is **strongly recommended** to avoid payload size limits.

**Response**:
```
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="inspection-report-2026-02-10.docx"

<Binary DOCX data>
```

**Report Contents**:
- Title page
- Date and timestamp
- For each image:
  - Image (optimized to 1200x1200px)
  - Filename
  - Environment classification
  - Technical assessment/comment
  - Page break

**Image Processing**:
- Fetched from Cloudinary CDN
- Optimized with Sharp
- JPEG quality: 85
- Max dimensions: 1200x1200px
- Batch size: 20 images at a time

**Example**:
```typescript
// Get image IDs from store
const imageIds = images.map(img => img.id);

// Generate report
const response = await fetch('/api/reports/normal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageIds })
});

// Download file
const blob = await response.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `inspection-report-${new Date().toISOString().split('T')[0]}.docx`;
a.click();
```

**Payload Size**:
- Image IDs format: ~36 bytes per image (114 images ≈ 4KB)
- Full data format: ~50-200KB per image (114 images ≈ 5-20MB ❌)

**Limits**:
- Recommended: <500 images per report
- Maximum: Limited by function timeout (300 seconds)
- Vercel payload limit: 4.5MB (use imageIds format)

**Error Responses**:
```json
// 400 Bad Request
{
  "error": "No images provided"
}

// 500 Internal Server Error
{
  "error": "Report generation failed: <details>"
}

// 413 Payload Too Large (old format with many images)
{
  "error": "Request Entity Too Large"
}
```

---

### POST `/api/reports/modified`

Generates a DOCX report with annotated images (if available) or original images.

**Authentication**: Required

**Request Body**:
```json
{
  "imageIds": [
    "abc-123",
    "def-456",
    "ghi-789"
  ]
}
```

**Response**: Same as `/api/reports/normal`

**Report Contents**:
- Same structure as normal report
- Uses annotated images when available
- Falls back to original if no annotations exist
- Shows bounding boxes and labels on images

**Image Selection Logic**:
```typescript
if (image.hasAnnotatedAsset) {
  // Use annotated version: abc-123_annotated
} else {
  // Use original: abc-123
}
```

**Example**:
```typescript
const imageIds = images.map(img => img.id);

const response = await fetch('/api/reports/modified', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageIds })
});

const blob = await response.blob();
// Download as inspection-report-annotated-2026-02-10.docx
```

**Error Responses**: Same as `/api/reports/normal`

---

## 🧪 Testing/Debug

### GET `/api/test-metadata/[id]`

Retrieves stored metadata for debugging purposes.

**Authentication**: Required

**URL Parameters**:
- `id` (string, required): Image UUID

**Response**:
```json
{
  "id": "abc-123",
  "name": "building-front.jpg",
  "comment": "Minor cracks visible",
  "environment": "outdoor",
  "annotations": [
    {
      "coordinates": [100, 150, 300, 400],
      "label": "Crack"
    }
  ],
  "status": "completed",
  "size": 1234567,
  "uploadedAt": "2026-02-10T17:00:00.000Z"
}
```

**Example**:
```typescript
const response = await fetch('/api/test-metadata/abc-123');
const metadata = await response.json();
console.log(metadata);
```

---

## ❌ Error Handling

### Error Response Format

All API errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Request completed successfully |
| 302 | Redirect | Auth redirect, logout |
| 400 | Bad Request | Missing or invalid parameters |
| 401 | Unauthorized | Invalid or missing authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 413 | Payload Too Large | Request body exceeds limit |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | External service down |

### Common Error Scenarios

#### OpenAI API Errors
```json
{
  "error": "OpenAI API Error: Rate limit exceeded"
}
```
**Solution**: Add delay between requests or upgrade OpenAI plan

#### Cloudinary Errors
```json
{
  "error": "Upload failed: Invalid credentials"
}
```
**Solution**: Check environment variables

#### Payload Size Errors
```json
{
  "error": "Request Entity Too Large"
}
```
**Solution**: Use `imageIds` format instead of full image data

#### Timeout Errors
```json
{
  "error": "Function execution timeout"
}
```
**Solution**: Reduce batch size or implement streaming

---

## ⏱️ Rate Limiting

### OpenAI API Limits
- **RPM** (Requests Per Minute): Varies by tier
- **TPM** (Tokens Per Minute): Varies by tier
- **Recommendation**: Add 500ms-2000ms delay between analysis requests

### Cloudinary Limits
- **Free Tier**: 25 GB storage, 25 GB bandwidth
- **Transformations**: 25,000 per month
- **Upload API**: No hard rate limit

### Vercel Function Limits
- **Hobby**: 100 GB-hours per month
- **Pro**: 1,000 GB-hours per month
- **Timeout**: 300 seconds (5 minutes) for report generation
- **Payload**: 4.5 MB request/response body

### Best Practices

1. **Batch Processing**: Process images in batches of 20-50
2. **Rate Limiting**: Add configurable delay between API calls
3. **Caching**: Cache Cloudinary images via CDN
4. **Monitoring**: Track API costs and usage
5. **Optimization**: Use image IDs instead of full data

---

## 📊 API Usage Examples

### Complete Workflow Example

```typescript
// 1. Upload images
for (const file of files) {
  const base64 = await imageToBase64(file);
  await fetch(`/api/images/${file.id}`, {
    method: 'POST',
    body: JSON.stringify({ imageData: base64 })
  });
}

// 2. Analyze images (with rate limiting)
for (const image of images) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ imageData: image.dataUrl })
  });
  const result = await response.json();
  
  // Save metadata
  await fetch(`/api/images/${image.id}`, {
    method: 'POST',
    body: JSON.stringify({
      ...image,
      comment: result.comment,
      environment: result.environment,
      status: 'completed'
    })
  });
  
  // Rate limiting delay
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// 3. Add annotations (optional)
await fetch(`/api/images/${imageId}/annotated`, {
  method: 'POST',
  body: JSON.stringify({
    annotations: [
      { coordinates: [100, 100, 300, 300], label: 'Crack' }
    ]
  })
});

// 4. Generate report
const imageIds = images.map(img => img.id);
const reportResponse = await fetch('/api/reports/modified', {
  method: 'POST',
  body: JSON.stringify({ imageIds })
});
const blob = await reportResponse.blob();
// Download blob
```

---

## 🔗 Related Documentation

- **DEVELOPER_GUIDE.md**: Setup and development guide
- **ARCHITECTURE.md**: Technical architecture
- **PROJECT_OVERVIEW.md**: High-level overview

---

**Last Updated**: February 2026
**API Version**: 0.1.0
