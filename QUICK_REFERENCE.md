# Quick Reference - Hirani Inspector

A quick cheatsheet for developers working with Hirani Inspector.

---

## 🚀 Quick Start

```bash
# Setup
git clone https://github.com/Shaikhmohddanish/hirani-inspector.git
cd hirani-inspector
npm install
cp .env.example .env.local  # Create and configure

# Development
npm run dev                  # Start dev server (localhost:3000)
npm run build               # Build for production
npm start                   # Run production build
npm run lint                # Run ESLint
npm run format              # Format with Prettier
```

---

## 📁 Project Structure Cheatsheet

```
src/
├── app/
│   ├── (dashboard)/dashboard/    # Main app
│   ├── api/                      # API endpoints
│   ├── login/                    # Login page
│   └── actions/                  # Server actions
├── components/
│   ├── analysis/                 # ImageCanvas
│   ├── auth/                     # LoginForm
│   ├── common/                   # LogTerminal
│   └── unified/                  # Main panel
├── lib/
│   ├── annotations.ts            # Image overlays
│   ├── auth.ts                   # Sessions
│   ├── cloudinary.ts             # Cloud storage
│   ├── reports.ts                # DOCX generation
│   └── storage.ts                # Storage abstraction
└── store/
    └── useAppStore.ts            # Zustand state
```

---

## 🔑 Environment Variables

```env
# Required
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
OPENAI_API_KEY=your_openai_key
```

---

## 🎯 Key Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js | Framework | 16.0.7 |
| React | UI Library | 19.2.0 |
| TypeScript | Type Safety | 5.x |
| Tailwind CSS | Styling | 4.x |
| Zustand | State Management | 5.0.9 |
| OpenAI | AI Analysis | GPT-4o |
| Cloudinary | Image Storage | 2.8.0 |
| Sharp | Image Processing | 0.34.5 |
| docx | Report Generation | 9.5.1 |

---

## 🌐 API Endpoints Quick Reference

### Analysis
```typescript
POST /api/analyze
Body: { imageData: "base64...", customPrompt?: "gpt" }
Response: { comment, environment, tokens, cost }
```

### Images
```typescript
GET    /api/images/[id]              # Fetch image
POST   /api/images/[id]              # Upload/update
DELETE /api/images/[id]              # Delete image
POST   /api/images/[id]/annotated    # Generate annotated
DELETE /api/images/cleanup           # Delete all
```

### Reports
```typescript
POST /api/reports/normal             # Normal report
POST /api/reports/modified           # Annotated report
Body: { imageIds: ["id1", "id2"] }
```

### Auth
```typescript
POST /api/auth/logout                # Sign out
```

---

## 💾 Zustand Store

```typescript
import { useAppStore } from '@/store/useAppStore';

// Read state
const images = useAppStore(state => state.images);
const logs = useAppStore(state => state.logs);

// Actions
const { addImages, updateStatus, addLog } = useAppStore();

addImages([newImage]);
updateStatus('id', 'completed', 'comment', 'indoor');
addLog('Message', 'info');
```

---

## 🖼️ Image Upload Flow

```typescript
// 1. Convert to base64
const base64 = await imageToBase64(file);

// 2. Upload to cloud
await fetch(`/api/images/${id}`, {
  method: 'POST',
  body: JSON.stringify({ imageData: base64 })
});

// 3. Add to store
addImages([{
  id,
  name: file.name,
  size: file.size,
  status: 'pending',
  dataUrl: base64
}]);
```

---

## 🤖 AI Analysis Flow

```typescript
// 1. Analyze with GPT
const response = await fetch('/api/analyze', {
  method: 'POST',
  body: JSON.stringify({ imageData: base64 })
});
const { comment, environment, cost } = await response.json();

// 2. Save metadata
await fetch(`/api/images/${id}`, {
  method: 'POST',
  body: JSON.stringify({
    id, name, comment, environment,
    status: 'completed'
  })
});

// 3. Update store
updateStatus(id, 'completed', comment, environment);
```

---

## 📝 Annotation Flow

```typescript
// 1. Draw boxes in ImageCanvas
const annotations = [
  {
    coordinates: [x1, y1, x2, y2],
    label: 'Crack in wall'
  }
];

// 2. Save to store
updateAnnotations(id, annotations);

// 3. Generate annotated image
await fetch(`/api/images/${id}/annotated`, {
  method: 'POST',
  body: JSON.stringify({ annotations })
});

// 4. Update flag
toggleAnnotation(id, true);
```

---

## 📄 Report Generation

```typescript
// Get image IDs (recommended)
const imageIds = images.map(img => img.id);

// Generate report
const response = await fetch('/api/reports/normal', {
  method: 'POST',
  body: JSON.stringify({ imageIds })
});

// Download
const blob = await response.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'inspection-report.docx';
a.click();
```

---

## 🎨 Common UI Patterns

### Client Component
```typescript
'use client';

import { useState } from 'react';

export function MyComponent() {
  const [state, setState] = useState('');
  return <div>{state}</div>;
}
```

### Server Action
```typescript
'use server';

import { cookies } from 'next/headers';

export async function myAction(formData: FormData) {
  const value = formData.get('field');
  // Process...
}
```

### API Route
```typescript
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ success: true });
}
```

---

## 🐛 Common Issues & Fixes

### Issue: Port 3000 in use
```bash
lsof -ti:3000 | xargs kill -9
# Or use different port
PORT=3001 npm run dev
```

### Issue: Environment variables not loading
```bash
# Restart dev server after .env.local changes
# Ensure variables start with NEXT_PUBLIC_ for client-side
```

### Issue: Payload too large
```typescript
// ❌ Don't send full image data for reports
body: JSON.stringify({ images: fullImageData })

// ✅ Send only IDs
body: JSON.stringify({ imageIds: ids })
```

### Issue: OpenAI rate limit
```typescript
// Add delay between requests
for (const image of images) {
  await analyzeImage(image);
  await new Promise(r => setTimeout(r, 1000)); // 1s delay
}
```

---

## 📊 Cost Tracking

```typescript
// OpenAI pricing (GPT-4o)
const inputCost = (promptTokens / 1000) * 0.005;
const outputCost = (completionTokens / 1000) * 0.015;
const totalCost = inputCost + outputCost;

// Typical cost per image: $0.02 - $0.05
```

---

## 🔒 Security Checklist

- [ ] Never commit `.env.local`
- [ ] Use environment variables for secrets
- [ ] Validate all user inputs
- [ ] Check authentication on API routes
- [ ] Use httpOnly cookies for sessions
- [ ] Sanitize data before storage
- [ ] Enable HTTPS in production
- [ ] Set secure cookie flags

---

## 🧪 Testing Workflow

```typescript
// 1. Upload test images (5-10 initially)
// 2. Run GPT analysis
// 3. Annotate 1-2 images
// 4. Generate both report types
// 5. Verify downloads and content
// 6. Test cleanup
```

---

## 📦 Deployment Checklist

- [ ] Set environment variables in Vercel
- [ ] Test production build locally
- [ ] Verify all API endpoints work
- [ ] Check image upload/download
- [ ] Test report generation
- [ ] Monitor function logs
- [ ] Verify cost tracking
- [ ] Test with production data

---

## 🔗 Documentation Links

- **PROJECT_OVERVIEW.md** - High-level overview
- **ARCHITECTURE.md** - Technical details
- **DEVELOPER_GUIDE.md** - Setup and onboarding
- **API_REFERENCE.md** - Complete API docs
- **FIX_SUMMARY.md** - Recent bug fixes
- **TESTING_GUIDE.md** - Testing procedures

---

## 💡 Useful Commands

```bash
# Git
git status
git add .
git commit -m "message"
git push

# Debugging
console.log('[Component]', data);
console.error('[Error]', error);

# Cloudinary cleanup (via API)
curl -X DELETE http://localhost:3000/api/images/cleanup

# Check running processes
ps aux | grep node

# View logs
npm run dev # Watch terminal output
```

---

## 📞 Quick Help

**Stuck?** Check:
1. Browser console (F12)
2. Terminal logs
3. `.env.local` configuration
4. Network tab for failed requests
5. Documentation files

**Need more help?**
- Read full docs in `/docs`
- Check GitHub issues
- Ask the team

---

**Last Updated**: February 2026
