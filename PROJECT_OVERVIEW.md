# Hirani Inspector - Project Overview

## 🏗️ Project Summary

**Hirani Inspector** is an AI-powered civil engineering inspection tool that automates the analysis of construction and structural images to detect defects and condition issues.

### Key Information
- **Type**: Next.js 16 Web Application
- **Primary Use Case**: Automated construction/structural image analysis and reporting
- **Target Users**: Civil engineers, building inspectors, construction managers
- **Deployment**: Vercel (optimized for serverless environment)

---

## 🎯 Core Features

### 1. **Batch Image Upload & Management**
- Upload multiple images simultaneously for bulk analysis
- Automatic image compression before cloud storage
- Persistent storage via Cloudinary CDN
- Image navigation with previous/next controls
- Individual image deletion with cleanup

### 2. **AI-Powered Structural Analysis**
- **AI Model**: OpenAI GPT-4o with vision capabilities
- **Detection Capabilities**:
  - Cracks and structural damage
  - Peeling paint and surface defects
  - Water damage and staining
  - Concrete honeycombing
  - Spalling and deterioration
- **Environment Classification**: Indoor/Outdoor detection
- **Customizable Prompts**: Default or custom GPT analysis modes
- **Cost Tracking**: Real-time API usage cost calculation and 7-day persistence

### 3. **Visual Annotation System**
- Interactive canvas-based annotation tool
- Draw rectangular bounding boxes on defect areas
- Add custom labels to highlight specific issues
- Zoom and scale support for precise marking
- Generate annotated image versions with yellow overlay boxes
- Read-only mode for review

### 4. **Report Generation**
- **Format**: Microsoft Word (.docx) documents
- **Two Report Types**:
  - **Normal Report**: Original images with analysis comments
  - **Modified Report**: Annotated images with markup visible
- **Content Included**:
  - All images with technical assessments
  - Environment classification (indoor/outdoor)
  - Annotation labels and coordinates
  - Timestamp and metadata
- **Optimized for Scale**: Handles 500+ images without payload limits
- **Batch Processing**: Images processed in groups of 20

### 5. **Real-Time Operations Dashboard**
- Live log terminal with color-coded messages
- Batch analysis progress tracking
- Rate limiting controls (configurable delay between API calls)
- Cost tracking display
- Upload/analysis status indicators

### 6. **Authentication & Security**
- Session-based authentication with cookies
- Protected routes and API endpoints
- Secure credential management
- Environment variable configuration

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 with Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand 5.0.9
- **UI Components**: Custom components with Tailwind

### Backend
- **Runtime**: Next.js API Routes (Serverless Functions)
- **Image Processing**: Sharp 0.34.5
- **Document Generation**: docx 9.5.1

### External Services
- **AI Analysis**: OpenAI API (GPT-4o with vision)
- **Image Storage**: Cloudinary 2.8.0
- **CDN**: Cloudinary CDN with next-cloudinary integration

### Development Tools
- **Linter**: ESLint 9
- **Formatter**: Prettier 3.7.4
- **Build Tool**: Next.js built-in compiler

---

## 📁 Project Structure

```
hirani-inspector/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Dashboard route group
│   │   │   ├── dashboard/      # Main dashboard page
│   │   │   └── layout.tsx      # Dashboard layout wrapper
│   │   ├── api/                # API Routes
│   │   │   ├── analyze/        # GPT-4o image analysis endpoint
│   │   │   ├── images/         # Image CRUD operations
│   │   │   ├── reports/        # Report generation endpoints
│   │   │   └── auth/           # Authentication endpoints
│   │   ├── actions/            # Server actions
│   │   ├── login/              # Login page
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page (redirect logic)
│   ├── components/             # React components
│   │   ├── analysis/           # ImageCanvas (annotation tool)
│   │   ├── auth/               # LoginForm
│   │   ├── common/             # LogTerminal (shared UI)
│   │   └── unified/            # UnifiedInspectorPanel (main dashboard)
│   ├── lib/                    # Utility libraries
│   │   ├── annotations.ts      # Annotation overlay generation
│   │   ├── auth.ts             # Session management
│   │   ├── cloudinary.ts       # Cloudinary SDK wrapper
│   │   ├── reports.ts          # DOCX report generation
│   │   └── storage.ts          # Storage abstraction layer
│   ├── store/                  # Zustand state management
│   │   └── useAppStore.ts      # Global app state
│   └── proxy.ts                # Cloudinary proxy configuration
├── public/                     # Static assets
├── .env.local                  # Environment variables (not in repo)
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── eslint.config.mjs           # ESLint configuration
├── .prettierrc                 # Prettier configuration
└── vercel.json                 # Vercel deployment config
```

---

## 🔄 Application Workflow

### Complete User Journey

```
1. Login
   ↓
2. Upload Images (Load Images button)
   → Client compresses images
   → Uploads to Cloudinary
   → Stores in Zustand state
   ↓
3. Batch GPT Analysis (Start GPT Analysis button)
   → Sends each image to /api/analyze
   → GPT-4o analyzes for defects
   → Returns: comment, environment, cost
   → Saves metadata to Cloudinary context
   ↓
4. Review & Annotate (Optional)
   → Navigate between images
   → Draw bounding boxes on defects
   → Save annotations to cloud
   ↓
5. Generate Reports
   → Normal Report: Original images + comments
   → Modified Report: Annotated images + comments
   → Downloads .docx file
   ↓
6. Cleanup (Optional)
   → Delete individual images
   → Bulk cleanup all images
```

---

## 🔌 API Endpoints

### Analysis
- `POST /api/analyze`
  - Analyzes image using GPT-4o
  - Input: base64 image, optional custom prompt
  - Output: comment, environment, tokens, cost

### Image Management
- `GET /api/images/[id]` - Retrieve image from Cloudinary
- `POST /api/images/[id]` - Upload image or store metadata
- `DELETE /api/images/[id]` - Delete image and annotations
- `POST /api/images/[id]/annotated` - Generate annotated version
- `DELETE /api/images/cleanup` - Bulk delete all images

### Reports
- `POST /api/reports/normal` - Generate standard report
- `POST /api/reports/modified` - Generate annotated report

### Authentication
- `POST /api/auth/login` - Create session (server action)
- `POST /api/auth/logout` - Destroy session

### Testing/Debug
- `GET /api/test-metadata/[id]` - Retrieve stored metadata

---

## 💾 Data Models

### ImageRecord (Zustand Store)
```typescript
{
  id: string;              // UUID
  name: string;            // Original filename
  size: number;            // File size in bytes
  uploadedAt: string;      // ISO timestamp
  status: "pending" | "analyzing" | "completed" | "error";
  comment?: string;        // GPT analysis result
  environment?: "indoor" | "outdoor" | "unknown";
  annotations: AnnotationBox[];  // Bounding boxes
  hasAnnotatedAsset: boolean;    // Has annotation overlay
  dataUrl?: string;        // Base64 image data
}
```

### AnnotationBox
```typescript
{
  coordinates: [number, number, number, number]; // [x1, y1, x2, y2]
  label: string;           // Custom label text
}
```

### LogEntry (Operation Logs)
```typescript
{
  timestamp: string;       // ISO timestamp
  message: string;         // Log message
  type?: "info" | "error" | "cost"; // Color coding
}
```

---

## ⚙️ Configuration

### Environment Variables (`.env.local`)
```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Authentication (Simple Session)
# No specific env var needed - uses hardcoded cookie check
```

### Vercel Configuration (`vercel.json`)
- **Max Duration**: 300 seconds (5 minutes) for functions
- **Memory**: 2048 MB
- Optimized for large report generation

### Next.js Configuration (`next.config.ts`)
- Image domains: Cloudinary CDN
- TypeScript strict mode

---

## 🔐 Security Considerations

### Current Implementation
- **Authentication**: Simple session cookie-based (not production-grade)
- **Session Validation**: Checks cookie value equals "active"
- **Middleware**: Disabled (`middleware.ts.disabled`)
- **API Protection**: Relies on session cookie checks

### Recommendations for Production
1. Implement proper JWT-based authentication
2. Add role-based access control (RBAC)
3. Enable and configure middleware for route protection
4. Add rate limiting for API endpoints
5. Sanitize user inputs in annotations
6. Implement CSRF protection
7. Use secure cookie flags (httpOnly, secure, sameSite)

---

## 📊 Performance Optimizations

### Recent Fix: Request Payload Optimization
**Problem**: Reports with 100+ images exceeded Vercel's 4.5MB payload limit

**Solution**: 
- Changed from sending full image data to sending image IDs only
- Server fetches images from Cloudinary storage
- **Payload reduction**: 99.9% smaller (10-20MB → ~4KB for 114 images)
- **Scalability**: Can now handle 500+ images without issues

### Other Optimizations
- Client-side image compression (quality 0.7, max 1200px)
- Batch processing in groups of 20 for reports
- Cloudinary CDN caching
- Sharp-based server-side image optimization
- Lazy loading and on-demand fetching

---

## 🧪 Testing

### Manual Testing Workflow
See `TESTING_GUIDE.md` for detailed instructions.

**Key Test Scenarios**:
1. Upload 114+ images
2. Batch GPT analysis
3. Generate normal report (verify no payload errors)
4. Generate modified report with annotations
5. Verify report contains all images with correct data

### No Automated Tests
Currently, the project does not include:
- Unit tests
- Integration tests
- E2E tests

**Recommendation**: Add testing infrastructure with Jest/Vitest and Playwright

---

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch
4. Monitor function logs for errors

### Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format
```

---

## 💰 Cost Considerations

### OpenAI API Costs
- **Model**: GPT-4o with vision
- **Input**: $0.005 per 1K tokens
- **Output**: $0.015 per 1K tokens
- **Typical Cost**: $0.02-0.05 per image analysis

### Cloudinary Costs
- **Free Tier**: 25 GB storage, 25 GB bandwidth
- **Transformations**: Included in free tier
- **Monitoring**: Track usage in Cloudinary dashboard

### Vercel Costs
- **Hobby Plan**: Free for personal projects
- **Pro Plan**: $20/month for production apps
- **Function Execution**: Charged per GB-hour

**Cost Tracking**: Application tracks API costs in-app with 7-day persistence

---

## 📝 Known Issues & Limitations

### Current Limitations
1. **Authentication**: Simplified session management (not production-ready)
2. **Middleware**: Disabled by default (requires manual enablement)
3. **No Automated Tests**: Manual testing only
4. **Single User**: No multi-user support or collaboration features
5. **Report Size**: Very large reports (1000+ images) may timeout
6. **No Background Jobs**: Report generation blocks until complete

### Planned Improvements
See `FIX_SUMMARY.md` for:
- Streaming report generation
- Background processing with email notifications
- Report caching
- Progressive loading

---

## 🤝 Contributing

### Development Guidelines
1. Follow existing code style (Prettier + ESLint)
2. Use TypeScript for type safety
3. Keep components focused and single-purpose
4. Document complex logic with comments
5. Test manually before committing

### Code Organization Principles
- **Components**: Organized by feature (analysis, auth, common, unified)
- **Libraries**: Keep utilities pure and reusable
- **API Routes**: One route per resource
- **State Management**: Centralized in Zustand store

---

## 📚 Additional Documentation

- **FIX_SUMMARY.md**: Details of payload optimization fix
- **TESTING_GUIDE.md**: Manual testing instructions
- **README.md**: Quick start guide

---

## 🔗 Useful Links

- **Next.js Docs**: https://nextjs.org/docs
- **OpenAI Vision API**: https://platform.openai.com/docs/guides/vision
- **Cloudinary Docs**: https://cloudinary.com/documentation
- **Zustand Docs**: https://zustand.docs.pmnd.rs/

---

## 📧 Support

For issues or questions, contact the development team or create a GitHub issue in the repository.

---

**Last Updated**: February 2026
**Version**: 0.1.0
**Maintainer**: Shaikhmohddanish
