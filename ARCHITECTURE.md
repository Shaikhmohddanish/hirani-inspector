# Hirani Inspector - Technical Architecture

## 🏛️ Architecture Overview

Hirani Inspector follows a modern **serverless architecture** with a **client-server model** built on Next.js 16 App Router.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  React Components (Next.js App Router)                     │ │
│  │  - UnifiedInspectorPanel (Main Dashboard)                  │ │
│  │  - ImageCanvas (Annotation Tool)                           │ │
│  │  - LoginForm (Authentication)                              │ │
│  │  - LogTerminal (Real-time Logs)                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Zustand Store (Client State Management)                   │ │
│  │  - images: ImageRecord[]                                   │ │
│  │  - logs: LogEntry[]                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js Server (Vercel)                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  API Routes (Serverless Functions)                         │ │
│  │  - /api/analyze          (GPT-4o Vision Analysis)          │ │
│  │  - /api/images/*         (Image CRUD Operations)           │ │
│  │  - /api/reports/*        (DOCX Report Generation)          │ │
│  │  - /api/auth/*           (Authentication)                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Utility Libraries (Server-Side)                           │ │
│  │  - lib/cloudinary.ts     (Cloudinary SDK)                  │ │
│  │  - lib/reports.ts        (DOCX Generation)                 │ │
│  │  - lib/annotations.ts    (Image Processing)                │ │
│  │  - lib/storage.ts        (Storage Abstraction)             │ │
│  │  - lib/auth.ts           (Session Management)              │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ External APIs
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   OpenAI API    │  │   Cloudinary    │  │  Cloudinary CDN │
│   (GPT-4o)      │  │   (Storage)     │  │  (Image Serve)  │
│                 │  │                 │  │                 │
│ - Vision API    │  │ - Upload        │  │ - Optimized     │
│ - JSON Mode     │  │ - Metadata      │  │   Delivery      │
│ - Token Tracking│  │ - Delete        │  │ - Auto Quality  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. Image Upload & Analysis Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. User selects files
       │
       ▼
┌─────────────────────────────┐
│ fabricateRecordsFromFiles() │  Client-side compression
│ - Creates dataUrl (base64)  │  Quality: 0.7, Max: 1200px
│ - Generates UUIDs           │
└──────┬──────────────────────┘
       │ 2. Add to Zustand store
       │
       ▼
┌─────────────────────────────┐
│  UnifiedInspectorPanel      │
│  handleFileUpload()         │
└──────┬──────────────────────┘
       │ 3. POST /api/images/[id]
       │    Body: base64 image
       │
       ▼
┌─────────────────────────────┐
│  API: /api/images/[id]      │
│  - Uploads to Cloudinary    │
│  - Stores with UUID as ID   │
└──────┬──────────────────────┘
       │ 4. Return success
       │
       ▼
┌─────────────────────────────┐
│  User clicks "Analyze"      │
└──────┬──────────────────────┘
       │ 5. Batch processing
       │
       ▼
┌─────────────────────────────┐
│  For each image:            │
│  POST /api/analyze          │
│  Body: { imageData }        │
└──────┬──────────────────────┘
       │ 6. GPT-4o Vision API
       │
       ▼
┌─────────────────────────────┐
│  OpenAI GPT-4o              │
│  - Analyzes image           │
│  - Returns JSON response    │
│  {                          │
│    comment: "...",          │
│    environment: "indoor"    │
│  }                          │
└──────┬──────────────────────┘
       │ 7. Save metadata
       │
       ▼
┌─────────────────────────────┐
│  POST /api/images/[id]      │
│  Body: {                    │
│    comment, environment,    │
│    annotations, status      │
│  }                          │
└──────┬──────────────────────┘
       │ 8. Store in Cloudinary context
       │
       ▼
┌─────────────────────────────┐
│  storeMetadataCloudinary()  │
│  - Encodes metadata base64  │
│  - Retries 3 times          │
│  - Updates image context    │
└──────┬──────────────────────┘
       │ 9. Update Zustand store
       │
       ▼
┌─────────────────────────────┐
│  updateStatus()             │
│  - Sets status: "completed" │
│  - Adds comment & env       │
└─────────────────────────────┘
```

### 2. Annotation Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. User draws boxes on ImageCanvas
       │
       ▼
┌─────────────────────────────┐
│  ImageCanvas Component      │
│  - Mouse events tracking    │
│  - Drawing yellow boxes     │
│  - Coordinate calculation   │
└──────┬──────────────────────┘
       │ 2. Save annotations
       │
       ▼
┌─────────────────────────────┐
│  updateAnnotations()        │
│  Zustand store              │
│  annotations: [             │
│    {coordinates, label}     │
│  ]                          │
└──────┬──────────────────────┘
       │ 3. POST /api/images/[id]/annotated
       │    Body: { annotations }
       │
       ▼
┌─────────────────────────────┐
│  API Route                  │
│  - Fetches original image   │
│  - Calls generateAnnotated  │
└──────┬──────────────────────┘
       │ 4. Generate overlay
       │
       ▼
┌─────────────────────────────┐
│  generateAnnotatedImage()   │
│  lib/annotations.ts         │
│  - Creates SVG overlay      │
│  - Composite with Sharp     │
│  - Returns PNG buffer       │
└──────┬──────────────────────┘
       │ 5. Upload annotated version
       │
       ▼
┌─────────────────────────────┐
│  storeAnnotatedImage()      │
│  - Uploads as [id]_annotated│
│  - Saves to Cloudinary      │
└──────┬──────────────────────┘
       │ 6. Update metadata
       │
       ▼
┌─────────────────────────────┐
│  toggleAnnotation(true)     │
│  hasAnnotatedAsset = true   │
└─────────────────────────────┘
```

### 3. Report Generation Flow (Optimized)

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. Click "Generate Report"
       │
       ▼
┌─────────────────────────────┐
│  handleGenerateNormal()     │
│  - Extracts image IDs only  │
│  - Creates imageIds array   │
└──────┬──────────────────────┘
       │ 2. POST /api/reports/normal
       │    Body: { imageIds: ["uuid1", "uuid2", ...] }
       │    Size: ~4KB (114 images)
       │
       ▼
┌─────────────────────────────┐
│  API: /api/reports/normal   │
│  - Receives image IDs       │
│  - Logs payload size        │
└──────┬──────────────────────┘
       │ 3. Fetch metadata from Cloudinary
       │
       ▼
┌─────────────────────────────┐
│  For each ID:               │
│  getMetadataCloudinary(id)  │
│  - Fetches from context     │
│  - Decodes base64 metadata  │
└──────┬──────────────────────┘
       │ 4. Reconstruct ImageRecords
       │
       ▼
┌─────────────────────────────┐
│  images = [{                │
│    id, name, comment,       │
│    environment, annotations │
│  }]                         │
└──────┬──────────────────────┘
       │ 5. Generate report
       │
       ▼
┌─────────────────────────────┐
│  generateNormalReport()     │
│  lib/reports.ts             │
│  - Process in batches of 20 │
│  - Fetch images from CDN    │
│  - Create DOCX with docx    │
└──────┬──────────────────────┘
       │ 6. Return Buffer
       │
       ▼
┌─────────────────────────────┐
│  Response                   │
│  - Content-Type: docx       │
│  - Content-Disposition      │
│  - Buffer stream            │
└──────┬──────────────────────┘
       │ 7. Browser downloads file
       │
       ▼
┌─────────────────────────────┐
│  inspection-report.docx     │
│  Saved to Downloads         │
└─────────────────────────────┘
```

---

## 🗄️ State Management Architecture

### Zustand Store Structure

```typescript
// /src/store/useAppStore.ts

interface AppState {
  // Data
  images: ImageRecord[];
  logs: LogEntry[];
  
  // Actions
  addImages: (images: ImageRecord[]) => void;
  updateStatus: (id: string, status: Status, comment?: string, environment?: Environment) => void;
  updateEnvironment: (id: string, environment: Environment) => void;
  toggleAnnotation: (id: string, hasAnnotatedAsset: boolean) => void;
  updateAnnotations: (id: string, annotations: AnnotationBox[]) => void;
  removeImage: (id: string) => void;
  addLog: (message: string, type?: LogType) => void;
  clearLogs: () => void;
  clear: () => void;
}
```

### State Flow Patterns

**Pattern 1: Optimistic Updates**
```
User Action → Update Zustand Store → API Call → Update on Success
```

**Pattern 2: API-First Updates**
```
User Action → API Call → On Success → Update Zustand Store
```

**Current Implementation**: Mix of both patterns
- Image uploads: API-first
- Analysis updates: API-first with progress tracking
- Annotations: Optimistic with API confirmation

---

## 🧩 Component Architecture

### Component Hierarchy

```
App Root (layout.tsx)
├── Login Page (/login)
│   └── LoginForm
│       └── Server Action: signIn()
│
└── Dashboard (/(dashboard)/dashboard)
    └── UnifiedInspectorPanel
        ├── Image Upload Section
        │   ├── File Input
        │   └── Upload Handler
        │
        ├── Analysis Controls
        │   ├── Rate Limiter Slider
        │   ├── Prompt Selector
        │   └── Batch Analyzer
        │
        ├── Image Viewer
        │   ├── ImageCanvas (annotation tool)
        │   ├── Navigation Controls
        │   └── Environment Selector
        │
        ├── Action Buttons
        │   ├── Save Annotations
        │   ├── Generate Reports
        │   └── Delete Image
        │
        └── LogTerminal (operation logs)
```

### Component Communication Patterns

**1. Zustand Store (Global State)**
```typescript
// Read state
const images = useAppStore(state => state.images);

// Write state
const addImages = useAppStore(state => state.addImages);
addImages(newImages);
```

**2. Props (Parent → Child)**
```typescript
<ImageCanvas
  imageUrl={currentImage.dataUrl}
  annotations={currentImage.annotations}
  onAnnotationChange={handleAnnotationChange}
/>
```

**3. Server Actions (Form → Server)**
```typescript
// In LoginForm
<form action={signIn}>
  <input name="email" />
  <input name="password" />
  <button type="submit">Sign In</button>
</form>
```

**4. API Routes (Client → Server)**
```typescript
// Client-side
const response = await fetch('/api/analyze', {
  method: 'POST',
  body: JSON.stringify({ imageData })
});

// Server-side (route.ts)
export async function POST(request: Request) {
  const { imageData } = await request.json();
  // Process...
}
```

---

## 🔌 API Architecture

### RESTful Endpoint Design

| Endpoint | Method | Purpose | Input | Output |
|----------|--------|---------|-------|--------|
| `/api/analyze` | POST | AI analysis | `{ imageData, customPrompt? }` | `{ comment, environment, tokens, cost }` |
| `/api/images/[id]` | GET | Fetch image | URL param: id | Image buffer or metadata JSON |
| `/api/images/[id]` | POST | Upload/update | Base64 or metadata JSON | `{ success, url? }` |
| `/api/images/[id]` | DELETE | Remove image | URL param: id | `{ success }` |
| `/api/images/[id]/annotated` | POST | Generate annotated | `{ annotations }` | `{ success, url }` |
| `/api/images/cleanup` | DELETE | Bulk delete | None | `{ deleted, errors }` |
| `/api/reports/normal` | POST | Normal report | `{ imageIds }` | DOCX buffer |
| `/api/reports/modified` | POST | Annotated report | `{ imageIds }` | DOCX buffer |
| `/api/auth/logout` | POST | Sign out | None | Redirect |

### API Route Structure

```typescript
// /src/app/api/[resource]/route.ts

// Standard pattern
export async function GET(request: Request) {
  // 1. Authentication check
  // 2. Parse request
  // 3. Validate input
  // 4. Execute business logic
  // 5. Return response
}

export async function POST(request: Request) {
  // Similar structure
}

// With dynamic routes
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  // Process...
}
```

---

## 📦 Library Architecture

### Abstraction Layers

```
┌─────────────────────────────────────────┐
│        Components (UI Layer)            │
│  - UnifiedInspectorPanel                │
│  - ImageCanvas                          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     Storage Layer (lib/storage.ts)      │
│  - storeImage()                         │
│  - getImage()                           │
│  - storeMetadata()                      │
│  - getMetadata()                        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   Cloudinary Layer (lib/cloudinary.ts)  │
│  - uploadToCloudinary()                 │
│  - getFromCloudinary()                  │
│  - storeMetadataCloudinary()            │
│  - getMetadataCloudinary()              │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     Cloudinary SDK (External)           │
│  - v2.uploader.upload()                 │
│  - v2.api.resource()                    │
│  - v2.uploader.destroy()                │
└─────────────────────────────────────────┘
```

### Library Responsibilities

**lib/storage.ts** (Abstraction)
- Provides clean API for image/metadata operations
- Hides implementation details (Cloudinary)
- Easy to swap storage provider in the future

**lib/cloudinary.ts** (Provider Implementation)
- Direct Cloudinary SDK integration
- Handles retries and error recovery
- Manages metadata encoding/decoding

**lib/reports.ts** (Business Logic)
- DOCX document generation with `docx` library
- Image optimization with Sharp
- Batch processing for memory efficiency

**lib/annotations.ts** (Image Processing)
- SVG overlay generation
- Sharp-based image composition
- Yellow box styling (6px stroke)

**lib/auth.ts** (Security)
- Session validation
- Cookie management
- Simple authentication logic

---

## 🔒 Authentication Architecture

### Current Implementation (Simplified)

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. POST to signIn() server action
       │    Body: { email, password }
       │
       ▼
┌─────────────────────────────┐
│  Server Action: signIn()    │
│  /src/app/actions/auth.ts   │
│  - Validates credentials    │
│  - Hardcoded check          │
└──────┬──────────────────────┘
       │ 2. Set cookie
       │
       ▼
┌─────────────────────────────┐
│  cookies().set(             │
│    "gak_inspector_session", │
│    "active",                │
│    { httpOnly: true }       │
│  )                          │
└──────┬──────────────────────┘
       │ 3. Redirect to /dashboard
       │
       ▼
┌─────────────────────────────┐
│  Dashboard loads            │
│  - Cookie present           │
│  - Access granted           │
└─────────────────────────────┘

┌─────────────────────────────┐
│  Middleware (Disabled)      │
│  middleware.ts.disabled     │
│  - Would check all routes   │
│  - Redirect unauthorized    │
└─────────────────────────────┘
```

### Authentication Flow

```typescript
// Login
User Input → signIn() → Validate → Set Cookie → Redirect

// Protected Route Access
Request → Check Cookie → Allow/Deny

// Logout
Click Logout → POST /api/auth/logout → Clear Cookie → Redirect
```

### Security Model

**Current**: Cookie-based session with value "active"
- ✅ Simple and lightweight
- ❌ Not production-ready
- ❌ No user roles or permissions
- ❌ Hardcoded credentials

**Recommended**: JWT-based authentication
- Use NextAuth.js or similar
- Store JWT in httpOnly cookie
- Add user roles and permissions
- Connect to proper user database

---

## 🖼️ Image Processing Pipeline

### Upload Pipeline

```
Original File
    │
    ▼
┌─────────────────────────────┐
│  Client-Side Compression    │
│  - Canvas API               │
│  - Quality: 0.7             │
│  - Max dimension: 1200px    │
│  - Output: base64 dataUrl   │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Upload to Cloudinary       │
│  - Convert base64 to buffer │
│  - Stream upload            │
│  - Public ID: UUID          │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Cloudinary Storage         │
│  - Original uploaded        │
│  - CDN URL generated        │
│  - Metadata attached        │
└─────────────────────────────┘
```

### Annotation Pipeline

```
Original Image (Cloudinary)
    │
    ▼
┌─────────────────────────────┐
│  Fetch Original             │
│  getFromCloudinary()        │
│  - Auto quality             │
│  - Max 1200x1200            │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Generate Annotations       │
│  generateAnnotatedImage()   │
│  1. Create SVG overlay      │
│  2. Composite with Sharp    │
│  3. Output PNG buffer       │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Upload Annotated           │
│  storeAnnotatedImage()      │
│  - Public ID: [uuid]_ann... │
│  - Separate asset           │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Both Versions Stored       │
│  - Original: [uuid]         │
│  - Annotated: [uuid]_ann... │
└─────────────────────────────┘
```

### Report Image Pipeline

```
For each image in report:
    │
    ▼
┌─────────────────────────────┐
│  Fetch from Cloudinary CDN  │
│  - Uses next-cloudinary     │
│  - Auto quality/format      │
│  - Cached by CDN            │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Optimize with Sharp        │
│  - Resize: 1200x1200        │
│  - JPEG quality: 85         │
│  - Convert to buffer        │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Add to DOCX Document       │
│  - Embedded as binary       │
│  - Formatted with metadata  │
└─────────────────────────────┘
```

---

## 💡 Design Patterns Used

### 1. **Repository Pattern** (Storage Abstraction)
```typescript
// lib/storage.ts acts as repository
export async function storeImage(id: string, buffer: Buffer) {
  // Implementation can change without affecting consumers
  return uploadToCloudinary(id, buffer);
}
```

### 2. **Singleton Pattern** (Zustand Store)
```typescript
// Single source of truth for app state
const useAppStore = create<AppState>((set) => ({
  images: [],
  logs: [],
  // ...
}));
```

### 3. **Factory Pattern** (Record Creation)
```typescript
// fabricateRecordsFromFiles creates ImageRecord objects
export async function fabricateRecordsFromFiles(files: File[]) {
  // Consistent object creation
}
```

### 4. **Adapter Pattern** (External Service Integration)
```typescript
// lib/cloudinary.ts adapts Cloudinary SDK to app needs
export async function uploadToCloudinary(id: string, buffer: Buffer) {
  // Adapts SDK methods to consistent interface
}
```

### 5. **Strategy Pattern** (Report Generation)
```typescript
// Different strategies: Normal vs Modified reports
generateNormalReport(images);
generateModifiedReport(images);
```

### 6. **Observer Pattern** (Zustand Subscriptions)
```typescript
// Components observe state changes
const logs = useAppStore(state => state.logs);
// Re-renders on logs update
```

---

## 🚀 Performance Considerations

### Client-Side Optimizations
1. **Image Compression**: Reduces upload size by ~70%
2. **Lazy State Updates**: Only re-renders affected components
3. **Batch Processing**: Handles multiple images efficiently
4. **Local State**: Zustand for instant updates

### Server-Side Optimizations
1. **Streaming Uploads**: Memory-efficient file handling
2. **Batch Report Generation**: 20 images at a time
3. **CDN Caching**: Cloudinary caches transformed images
4. **Payload Optimization**: Send IDs instead of full data (99.9% reduction)

### Vercel Optimizations
1. **Edge Functions**: Fast response times
2. **Automatic Code Splitting**: Next.js App Router
3. **Image Optimization**: next/image components
4. **Function Memory**: 2048 MB for large reports
5. **Max Duration**: 300 seconds for report generation

---

## 🔄 Error Handling Strategy

### Client-Side
```typescript
try {
  await uploadImage();
  addLog('✅ Upload successful');
} catch (error) {
  addLog(`❌ Upload failed: ${error.message}`, 'error');
}
```

### Server-Side
```typescript
export async function POST(request: Request) {
  try {
    // Process request
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Error]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Retry Logic
```typescript
// lib/cloudinary.ts
for (let attempt = 0; attempt < maxRetries; attempt++) {
  try {
    await operation();
    break;
  } catch (error) {
    if (attempt === maxRetries - 1) throw error;
    await delay(1000 * (attempt + 1));
  }
}
```

---

## 📊 Scalability Considerations

### Current Limitations
- **Single Server**: No horizontal scaling (Vercel handles this)
- **In-Memory Processing**: Large reports consume function memory
- **Synchronous Reports**: User waits for completion

### Scalability Strategies
1. **Streaming**: Implement streaming report generation
2. **Background Jobs**: Queue large reports for async processing
3. **Caching**: Cache generated reports for 24 hours
4. **Pagination**: Load images in chunks
5. **Database**: Add proper database for metadata (currently Cloudinary context)

### Current Capacity
- ✅ 500+ images per batch (tested)
- ✅ 114 images per report (validated)
- ⚠️ 1000+ images may approach memory limits

---

## 🔧 Configuration Architecture

### Environment-Based Configuration

```typescript
// Environment variables
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
OPENAI_API_KEY

// Next.js Config (next.config.ts)
export default {
  images: {
    domains: ['res.cloudinary.com']
  }
};

// Vercel Config (vercel.json)
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 300,
      "memory": 2048
    }
  }
}
```

---

## 🎯 Future Architecture Recommendations

### Short-Term Improvements
1. Enable and configure middleware for route protection
2. Add proper user authentication with NextAuth.js
3. Implement automated testing (Jest + Playwright)
4. Add error boundary components
5. Implement loading states and skeleton screens

### Long-Term Improvements
1. **Database Integration**: PostgreSQL for metadata storage
2. **Background Jobs**: Bull/BullMQ for async processing
3. **Caching Layer**: Redis for session and report caching
4. **Real-time Updates**: WebSocket for live progress
5. **Multi-tenancy**: Support for multiple organizations
6. **Audit Logging**: Track all user actions
7. **Analytics**: Usage tracking and reporting

---

**Last Updated**: February 2026
**Maintainers**: Development Team
