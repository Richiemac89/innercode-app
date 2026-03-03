# 🚀 Deployment Guide - InnerCode App

## Overview

This guide will walk you through deploying your InnerCode app to Netlify for production use. The app is optimized for mobile devices and ready for user testing.

## Prerequisites

Before deploying, ensure you have:

- ✅ A Supabase project set up with production credentials
- ✅ Your app builds successfully locally (`npm run build`)
- ✅ All environment variables ready
- ✅ A Netlify account (free tier is fine)

---

## Option 1: Drag-and-Drop Deployment (Easiest)

### Step 1: Build Your App

```bash
cd innercode-app
npm run build
```

This creates a `dist` folder with your production-ready app.

### Step 2: Deploy to Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Sign up or log in (can use GitHub, GitLab, or email)
3. Click **"Add new site" → "Deploy manually"**
4. Drag and drop the `dist` folder
5. Wait 30-60 seconds for deployment

### Step 3: Configure Environment Variables

1. Click on **"Site configuration" → "Environment variables"**
2. Add these variables:
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key

### Step 4: Redeploy with Environment Variables

After adding environment variables, you need to rebuild:

1. Run `npm run build` again locally
2. Drag and drop the new `dist` folder to Netlify
3. Or click **"Deploys" → "Trigger deploy" → "Clear cache and deploy site"**

### Step 5: Update Supabase Redirect URLs

1. Go to your Supabase dashboard
2. Navigate to **Authentication → URL Configuration**
3. Add your Netlify URL to **Redirect URLs**:
   - Example: `https://your-app-name.netlify.app`
4. Set **Site URL** to your Netlify URL
5. Click **Save**

### Step 6: Test Your Deployment

1. Visit your Netlify URL
2. Test the complete signup flow
3. Check email verification works
4. Test on your phone (iOS/Android)

---

## Option 2: GitHub Integration (Recommended Long-term)

### Benefits

- Automatic redeployments when you make changes
- Version history and rollbacks
- Easier collaboration
- Professional workflow

### Setup Steps

#### A. Create a GitHub Account & Repository

1. Go to [github.com](https://github.com) and sign up
2. Click **"New repository"**
3. Name it `innercode-app` (or your choice)
4. Choose **"Private"** (recommended)
5. Click **"Create repository"**

#### B. Push Your Code to GitHub

First time setup (run these commands in your project folder):

```bash
cd innercode-app

# Initialize git (if not already done)
git init

# Add all files
git add .

# Make first commit
git commit -m "Initial commit - production ready"

# Connect to GitHub (replace YOUR-USERNAME and YOUR-REPO)
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/innercode-app.git
git push -u origin main
```

You'll need to authenticate with GitHub - follow the prompts.

#### C. Connect Netlify to GitHub

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click **"Add new site" → "Import an existing project"**
3. Choose **"GitHub"** (authorize if needed)
4. Select your `innercode-app` repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Branch to deploy**: `main`

#### D. Add Environment Variables

1. In Netlify, go to **"Site configuration" → "Environment variables"**
2. Add:
   - `VITE_SUPABASE_URL` = Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
3. Click **"Save"**

#### E. Deploy

1. Click **"Deploy site"**
2. Netlify will automatically:
   - Clone your repository
   - Install dependencies
   - Build your app
   - Deploy it

#### F. Update Supabase Redirect URLs

Same as Option 1, Step 5 above.

---

## Post-Deployment Checklist

### Essential Tests

- [ ] Landing page loads correctly
- [ ] Sign up flow works end-to-end
- [ ] Email verification link redirects properly
- [ ] Login works for existing users
- [ ] Dashboard shows correct data
- [ ] Journal entries save correctly
- [ ] Results page displays properly
- [ ] Sign out works

### Mobile Testing

- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] "Add to Home Screen" works
- [ ] Touch targets are easy to tap
- [ ] Keyboard doesn't cover inputs
- [ ] Scrolling is smooth

### Performance

- [ ] Initial page load is under 3 seconds
- [ ] No console errors in browser DevTools
- [ ] Images/icons load properly

---

## Updating Your Deployed App

### For Drag-and-Drop Method

1. Make your changes locally
2. Test with `npm run dev`
3. Build with `npm run build`
4. Drag new `dist` folder to Netlify

### For GitHub Method

1. Make your changes locally
2. Test with `npm run dev`
3. Commit and push:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
4. Netlify automatically rebuilds and deploys!

---

## Custom Domain (Optional)

### Using Your Own Domain

1. Buy a domain from Namecheap, Google Domains, etc.
2. In Netlify: **"Domain management" → "Add custom domain"**
3. Follow Netlify's instructions to configure DNS
4. SSL certificate is automatically added (free via Let's Encrypt)
5. Update Supabase redirect URLs with your custom domain

---

## Troubleshooting

### "Page not found" on refresh

**Solution**: The `netlify.toml` file handles this. Make sure it's in your project root.

### Environment variables not working

**Solutions**:
1. Check they're named exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Redeploy after adding them
3. Clear build cache: **"Deploys" → "Trigger deploy" → "Clear cache and deploy site"**

### Email verification redirects to wrong URL

**Solution**: Update Supabase redirect URLs to match your Netlify domain exactly.

### Build fails on Netlify

**Solutions**:
1. Check the build log for errors
2. Ensure `npm run build` works locally
3. Check Node version: Set to 18 in Netlify: **"Site configuration" → "Build & deploy" → "Environment" → "Node version"**

### App works locally but not on Netlify

**Causes**:
1. Missing environment variables
2. Hard-coded localhost URLs
3. CORS issues with Supabase

**Solution**: Check browser console for errors on the deployed site.

---

## Monitoring & Analytics

### Netlify Analytics (Optional, $9/month)

Provides:
- Page view statistics
- Top pages
- Traffic sources
- No cookies needed (privacy-friendly)

Enable in: **"Site configuration" → "Analytics"**

### Free Alternatives

- Google Analytics (add script to `index.html`)
- Plausible Analytics (privacy-focused, open source)
- Umami Analytics (free, self-hosted)

---

## Security Best Practices

### ✅ Already Implemented

- Security headers in `netlify.toml`
- Row Level Security in Supabase
- Environment variables for secrets
- HTTPS automatically enabled
- Console logs removed in production

### Additional Recommendations

1. **Enable Supabase Email Rate Limiting**
   - Go to Supabase Authentication settings
   - Prevents spam signups

2. **Monitor Supabase Usage**
   - Check your dashboard weekly
   - Free tier: 50,000 active users, 500MB database
   - Set up billing alerts

3. **Regular Backups**
   - Supabase auto-backups (paid plans)
   - Or export database regularly

---

## Scaling Considerations

### Current Setup Handles

- Thousands of monthly active users
- Netlify free tier: 100GB bandwidth/month
- Supabase free tier: 50,000 active users

### When You Outgrow Free Tiers

- **Netlify Pro**: $19/month (more bandwidth, faster builds)
- **Supabase Pro**: $25/month (more database storage, backups)
- **CDN**: Use Cloudflare (free) for better global performance

---

## Need Help?

### Resources

- Netlify Documentation: https://docs.netlify.com
- Supabase Documentation: https://supabase.com/docs
- Netlify Community: https://answers.netlify.com
- Supabase Discord: https://discord.supabase.com

### Common Issues

Check `TROUBLESHOOTING.md` in your project for solutions to common problems.

---

## Next Steps After Deployment

1. **Share with Beta Testers**
   - Send them your Netlify URL
   - Ask for feedback on mobile experience
   - Create a feedback form (Google Forms, Typeform)

2. **Monitor User Feedback**
   - Track common issues
   - Note feature requests
   - Prioritize improvements

3. **Iterate and Improve**
   - Fix bugs quickly
   - Add requested features
   - Improve UI based on feedback

4. **Future Enhancements**
   - AI integration for personalized insights
   - Stripe for premium features
   - iOS/Android native apps (via Capacitor)
   - Export features (PDF, CSV)
   - Social features (optional)

---

**You're ready to deploy! 🎉**

Choose Option 1 for quick deployment or Option 2 for long-term sustainability.

Good luck with your launch!

