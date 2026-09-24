# Deployment Guide - EduTech Compiler

## Prerequisites Complete ✅

The application has been prepared for Vercel deployment with the following optimizations:

### 1. ✅ Next.js Configuration (`next.config.ts`)
- Set `output: 'standalone'` for serverless deployment
- Configured image optimization with WebP and AVIF formats
- Added package import optimizations
- Enabled compression
- Configured environment variables

### 2. ✅ Vercel Ignore File (`.vercelignore`)
- Excludes unnecessary files from deployment
- Reduces bundle size and deployment time
- Excludes development files, documentation, and local configs

### 3. ✅ Build Optimization
- Fixed TypeScript linting errors
- Resolved SSR compatibility issues with localStorage
- Build passes successfully with `npm run build`

## Manual Deployment Steps

### Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Click "New repository"
3. Name it `brightspace-compiler` (or your preferred name)
4. Make it public or private as needed
5. **Do NOT** initialize with README, .gitignore, or license (we have them)
6. Click "Create repository"

### Step 2: Push to GitHub
After creating the repository, run these commands:

```bash
# Add GitHub as remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/brightspace-compiler.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Import your `brightspace-compiler` repository
5. Vercel will auto-detect it's a Next.js project
6. **IMPORTANT**: Set environment variables:
   - `NEXT_PUBLIC_JUDGE0_URL` = your Judge0 endpoint URL
   - For tmole tunnel: `https://brightspace-judge0.tunnelmole.net`
   - For hosted Judge0: your hosted endpoint URL

### Step 4: Configure Environment Variables in Vercel
1. In your Vercel project dashboard, go to "Settings" → "Environment Variables"
2. Add the following variables:
   - **Variable**: `NEXT_PUBLIC_JUDGE0_URL`
   - **Value**: `https://brightspace-judge0.tunnelmole.net` (or your Judge0 endpoint)
   - **Environment**: Production, Preview, Development (check all)

### Step 5: Deploy
1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be live at `https://your-project-name.vercel.app`

## Vercel CLI Deployment (Alternative)

If you prefer using Vercel CLI:

```bash
# Install Vercel CLI (already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Post-Deployment Checklist

- [ ] ✅ Application builds successfully (`npm run build`)
- [ ] Repository pushed to GitHub
- [ ] Vercel project created and connected to GitHub
- [ ] Environment variable `NEXT_PUBLIC_JUDGE0_URL` set in Vercel
- [ ] Live deployment accessible
- [ ] Code compilation works on live site
- [ ] Judge0 connection successful

## Judge0 Endpoint Options

### Option 1: Tmole Tunnel (Development/Testing)
- URL: `https://brightspace-judge0.tunnelmole.net`
- Requires your local Judge0 instance running on port 2358
- Run: `npm run tunnel` to start the tunnel
- Not recommended for production due to reliability

### Option 2: Hosted Judge0 (Production)
- Host your Judge0 instance on a cloud provider
- Update `NEXT_PUBLIC_JUDGE0_URL` to your hosted endpoint
- Recommended for production use

## Troubleshooting

### Build Errors
- All TypeScript errors have been resolved
- SSR localStorage issues have been fixed
- If you encounter new errors, check the Vercel build logs

### API Connection Issues
- Verify `NEXT_PUBLIC_JUDGE0_URL` is set correctly
- Ensure Judge0 instance is accessible from the internet
- Check CORS settings on your Judge0 instance

### Performance
- Images are optimized for WebP/AVIF
- Bundle is optimized for serverless deployment
- Package imports are optimized

## Next Steps After Deployment

1. Test all language compilation on the live site
2. Monitor performance and errors in Vercel dashboard
3. Consider setting up a production Judge0 instance
4. Add monitoring and analytics if needed
5. Set up custom domain if desired

---

**Status**: Ready for deployment ✅
**Last Updated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
