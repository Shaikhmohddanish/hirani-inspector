# Developer Onboarding Guide - Hirani Inspector

Welcome to the Hirani Inspector project! This guide will help you get up and running quickly.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.x or later ([Download](https://nodejs.org/))
- **npm**: v10.x or later (comes with Node.js)
- **Git**: For version control ([Download](https://git-scm.com/))
- **Code Editor**: VS Code recommended ([Download](https://code.visualstudio.com/))

### Recommended VS Code Extensions
- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- TypeScript + JavaScript Language Features

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Shaikhmohddanish/hirani-inspector.git
cd hirani-inspector
```

### 2. Install Dependencies

```bash
npm install
```

This will install all packages defined in `package.json`.

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
touch .env.local
```

Add the following environment variables:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

**How to get credentials:**

#### Cloudinary Setup
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Go to Dashboard → Settings → Account
3. Copy your **Cloud Name**, **API Key**, and **API Secret**
4. Create an upload preset:
   - Go to Settings → Upload
   - Click "Add upload preset"
   - Set signing mode to "Unsigned"
   - Copy the preset name

#### OpenAI Setup
1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Go to API Keys section
3. Click "Create new secret key"
4. Copy the key (you won't see it again!)
5. Add credits to your account

### 4. Run the Development Server

```bash
npm run dev
```

The application will start at [http://localhost:3000](http://localhost:3000)

### 5. Default Login Credentials

**Important**: The current authentication is simplified and hardcoded.

Check `/src/app/actions/auth.ts` for the credentials (look for the validation logic).

**Note**: This is NOT production-ready. You'll need to implement proper authentication.

---

## 📁 Project Structure Explained

```
hirani-inspector/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Protected routes group
│   │   │   └── dashboard/      # Main application dashboard
│   │   ├── api/                # API endpoints (serverless functions)
│   │   ├── login/              # Login page
│   │   ├── layout.tsx          # Root layout with fonts & metadata
│   │   └── page.tsx            # Home page (redirects to dashboard)
│   │
│   ├── components/             # React components
│   │   ├── analysis/           # ImageCanvas for annotations
│   │   ├── auth/               # LoginForm component
│   │   ├── common/             # Shared components (LogTerminal)
│   │   └── unified/            # Main dashboard panel
│   │
│   ├── lib/                    # Utility libraries
│   │   ├── annotations.ts      # Image annotation generation
│   │   ├── auth.ts             # Session validation
│   │   ├── cloudinary.ts       # Cloudinary SDK wrapper
│   │   ├── reports.ts          # DOCX report generation
│   │   └── storage.ts          # Storage abstraction layer
│   │
│   ├── store/                  # Zustand state management
│   │   └── useAppStore.ts      # Global app state
│   │
│   └── proxy.ts                # Cloudinary proxy config
│
├── public/                     # Static files (favicon, images)
├── .env.local                  # Environment variables (create this)
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── vercel.json                 # Vercel deployment settings
```

---

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server on localhost:3000

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint to check for issues
npm run format       # Format code with Prettier
```

---

## 🔍 Understanding the Codebase

### Key Concepts

#### 1. **Next.js App Router**
This project uses Next.js 16 with the App Router (not Pages Router).

- **File-based routing**: Files in `/src/app` define routes
- **Route groups**: `(dashboard)` is a route group (doesn't affect URL)
- **Server components**: By default, components are server-side
- **Client components**: Use `"use client"` directive for client-side

#### 2. **Zustand State Management**
Global state is managed with Zustand, not Redux or Context.

```typescript
import { useAppStore } from '@/store/useAppStore';

function MyComponent() {
  // Select specific state
  const images = useAppStore(state => state.images);
  
  // Get actions
  const addImages = useAppStore(state => state.addImages);
  
  // Use them
  addImages(newImages);
}
```

#### 3. **API Routes**
API endpoints are in `/src/app/api/[name]/route.ts`.

```typescript
// Example: /api/hello/route.ts
export async function GET(request: Request) {
  return Response.json({ message: 'Hello' });
}

export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ received: body });
}
```

#### 4. **Server Actions**
Form handling uses Next.js server actions.

```typescript
// In /src/app/actions/auth.ts
'use server';

export async function signIn(formData: FormData) {
  const email = formData.get('email');
  // Process login...
}
```

---

## 🔄 Common Development Tasks

### Adding a New API Endpoint

1. Create file: `/src/app/api/myendpoint/route.ts`
2. Define handler:

```typescript
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Process data
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Adding a New Component

1. Create file: `/src/components/category/MyComponent.tsx`
2. Define component:

```typescript
'use client'; // If it needs client-side features

export function MyComponent() {
  return <div>My Component</div>;
}
```

### Adding to Zustand Store

1. Open `/src/store/useAppStore.ts`
2. Add to interface:

```typescript
interface AppState {
  // Existing...
  myNewData: string[];
  setMyNewData: (data: string[]) => void;
}
```

3. Add to store:

```typescript
const useAppStore = create<AppState>((set) => ({
  // Existing...
  myNewData: [],
  setMyNewData: (data) => set({ myNewData: data }),
}));
```

### Adding a New Library Function

1. Create file: `/src/lib/myfeature.ts`
2. Export functions:

```typescript
export async function myUtilityFunction(param: string) {
  // Implementation
  return result;
}
```

---

## 🐛 Debugging Tips

### Check Browser Console
- Open DevTools (F12)
- Look for errors in Console tab
- Check Network tab for failed API requests

### Check Server Logs
When running `npm run dev`, check your terminal for server-side errors:

```bash
[API] Error in /api/analyze: <error message>
```

### Common Issues

#### Issue: "Environment variable not found"
**Solution**: Check `.env.local` exists and has all required variables.

#### Issue: "Cannot find module"
**Solution**: Run `npm install` again.

#### Issue: "Port 3000 is already in use"
**Solution**: 
```bash
# Kill process on port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

#### Issue: "Cloudinary upload failed"
**Solution**: Verify Cloudinary credentials in `.env.local`.

#### Issue: "OpenAI API error"
**Solution**: 
- Check API key is valid
- Ensure you have credits in your OpenAI account
- Check rate limits

---

## 🧪 Testing the Application

### Manual Testing Workflow

1. **Start the app**: `npm run dev`
2. **Login**: Use credentials from `/src/app/actions/auth.ts`
3. **Upload images**: 
   - Click "Load Images"
   - Select test images (try with 5-10 images first)
4. **Analyze images**:
   - Click "Start GPT Analysis"
   - Wait for completion
5. **Annotate** (optional):
   - Navigate to an image
   - Draw boxes on defects
   - Click "Save Annotations to Cloud"
6. **Generate report**:
   - Click "Generate Normal Report"
   - Check Downloads folder for .docx file

### Test Images
Use construction/building images with visible defects:
- Cracks in walls or concrete
- Peeling paint
- Water damage stains
- Structural issues

**Where to find test images**:
- Take photos of your own building
- Use free stock photos from Unsplash/Pexels
- Search for "building defects" or "construction damage"

---

## 📚 Learning Resources

### Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Tutorial](https://nextjs.org/docs/app)
- [API Routes Guide](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript with React](https://react-typescript-cheatsheet.netlify.app/)

### Zustand
- [Zustand Documentation](https://zustand.docs.pmnd.rs/)
- [Getting Started Guide](https://zustand.docs.pmnd.rs/getting-started/introduction)

### Tailwind CSS
- [Tailwind Documentation](https://tailwindcss.com/docs)
- [Utility Classes](https://tailwindcss.com/docs/utility-first)

### OpenAI Vision API
- [Vision API Guide](https://platform.openai.com/docs/guides/vision)
- [API Reference](https://platform.openai.com/docs/api-reference)

### Cloudinary
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Upload API](https://cloudinary.com/documentation/image_upload_api_reference)

---

## 🏗️ Code Style Guide

### TypeScript
```typescript
// Use interfaces for objects
interface User {
  id: string;
  name: string;
}

// Use type for unions/primitives
type Status = 'pending' | 'completed';

// Prefer async/await over .then()
async function fetchData() {
  const response = await fetch('/api/data');
  return response.json();
}
```

### React Components
```typescript
// Functional components with TypeScript
interface Props {
  title: string;
  onClose: () => void;
}

export function MyComponent({ title, onClose }: Props) {
  return <div>{title}</div>;
}
```

### Naming Conventions
- **Components**: PascalCase (`MyComponent.tsx`)
- **Functions**: camelCase (`fetchUserData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Files**: kebab-case for utilities (`image-processor.ts`)

### Imports Order
```typescript
// 1. External packages
import { useState } from 'react';
import { NextResponse } from 'next/server';

// 2. Internal utilities
import { uploadImage } from '@/lib/storage';

// 3. Components
import { Button } from '@/components/common/Button';

// 4. Types
import type { ImageRecord } from '@/types';
```

---

## 🚢 Deployment Guide

### Deploying to Vercel

1. **Push to GitHub**:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Environment Variables**:
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all variables from `.env.local`
   - Click "Save"

4. **Deploy**:
   - Vercel auto-deploys on every push to main
   - Or click "Deploy" in dashboard

5. **Verify**:
   - Visit your deployment URL
   - Test login, upload, analysis, and reports

### Environment-Specific Settings

**Development** (`.env.local`):
- Use development API keys
- Enable debug logging

**Production** (Vercel):
- Use production API keys
- Disable debug logging
- Set secure cookie flags

---

## 🔒 Security Best Practices

### Never Commit Secrets
- ❌ Don't commit `.env.local` to Git
- ✅ Add it to `.gitignore` (already done)
- ✅ Use Vercel environment variables for production

### API Keys
- 🔑 Rotate keys periodically
- 🚫 Never expose keys in client-side code
- ✅ Use `NEXT_PUBLIC_` prefix only for public values

### User Input
- 🧹 Sanitize all user inputs
- 🛡️ Validate data on server-side
- 🚫 Never trust client-side validation alone

---

## 🤝 Contributing

### Before Making Changes
1. Create a new branch: `git checkout -b feature/my-feature`
2. Make small, focused commits
3. Write meaningful commit messages
4. Test your changes thoroughly

### Pull Request Process
1. Push your branch to GitHub
2. Open a Pull Request
3. Describe your changes clearly
4. Wait for code review
5. Address feedback
6. Merge when approved

### Commit Message Format
```
feat: Add image batch deletion feature
fix: Resolve report generation timeout
docs: Update API documentation
refactor: Simplify annotation logic
style: Format code with Prettier
```

---

## 📞 Getting Help

### Internal Resources
- **PROJECT_OVERVIEW.md**: High-level project documentation
- **ARCHITECTURE.md**: Technical architecture details
- **FIX_SUMMARY.md**: Recent bug fixes and solutions
- **TESTING_GUIDE.md**: Testing procedures

### External Resources
- [Next.js Discord](https://discord.com/invite/nextjs)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/next.js)
- [GitHub Issues](https://github.com/Shaikhmohddanish/hirani-inspector/issues)

### Common Questions

**Q: How do I add authentication for multiple users?**
A: You'll need to implement proper authentication with NextAuth.js or similar. Current implementation is simplified for demo purposes.

**Q: Can I use a different cloud storage provider?**
A: Yes! Update `lib/cloudinary.ts` to use your provider's SDK, keeping the same interface.

**Q: How do I optimize for larger image batches?**
A: Consider implementing background job processing with Bull/BullMQ for batches >200 images.

**Q: Where are images stored?**
A: Images are stored in Cloudinary CDN. Metadata is stored in Cloudinary context (base64 encoded).

---

## ✅ Checklist for New Developers

After completing this guide, you should be able to:

- [ ] Clone and run the project locally
- [ ] Understand the project structure
- [ ] Navigate the codebase confidently
- [ ] Create new API endpoints
- [ ] Add new React components
- [ ] Update Zustand store
- [ ] Debug common issues
- [ ] Test the complete workflow
- [ ] Deploy to Vercel

---

## 🎉 Welcome Aboard!

You're now ready to contribute to Hirani Inspector. If you have questions or run into issues, don't hesitate to ask the team or consult the documentation.

Happy coding! 🚀

---

**Last Updated**: February 2026
**Maintained by**: Development Team
