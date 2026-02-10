# Hirani Inspector

AI-powered civil engineering inspection automation tool that analyzes construction and structural images to detect defects and generate professional reports.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local  # Then add your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## ✨ Key Features

- 🤖 **AI-Powered Analysis**: Automated defect detection using OpenAI GPT-4o Vision
- 📸 **Batch Processing**: Upload and analyze hundreds of images simultaneously
- 🎨 **Visual Annotations**: Draw bounding boxes to highlight defects
- 📄 **Professional Reports**: Generate Word documents with images and analysis
- ☁️ **Cloud Storage**: Persistent image storage via Cloudinary CDN
- 💰 **Cost Tracking**: Real-time API usage cost monitoring

## 📚 Documentation

**Start here:** [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - Complete guide to all documentation

### Essential Docs

- **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** - Setup, onboarding, and development guide
- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - What this project does and how it works
- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete API documentation
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture and design
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Cheatsheet for common tasks

### Additional Resources

- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Comprehensive project understanding
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing procedures and workflows
- **[FIX_SUMMARY.md](FIX_SUMMARY.md)** - Recent bug fixes and solutions

## 🛠️ Tech Stack

- **Frontend**: React 19, Next.js 16, TypeScript, Tailwind CSS
- **State**: Zustand
- **Backend**: Next.js API Routes (Serverless)
- **AI**: OpenAI GPT-4o Vision API
- **Storage**: Cloudinary
- **Reports**: DOCX library with Sharp image processing

## 🔧 Development

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Run production build
npm run lint       # Lint code
npm run format     # Format code with Prettier
```

## 📝 Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
OPENAI_API_KEY=your_openai_key
```

See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md#3-set-up-environment-variables) for detailed setup instructions.

## 🚀 Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Shaikhmohddanish/hirani-inspector)

See [DEVELOPER_GUIDE.md - Deployment](DEVELOPER_GUIDE.md#-deployment-guide) for manual deployment instructions.

## 🤝 Contributing

1. Read [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for development setup
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is built with [Next.js](https://nextjs.org).

## 🔗 Links

- [Documentation Index](DOCUMENTATION_INDEX.md) - Complete documentation guide
- [GitHub Repository](https://github.com/Shaikhmohddanish/hirani-inspector)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [Cloudinary Docs](https://cloudinary.com/documentation)

---

**Need help?** Check out the [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) to find the right guide for your needs.
