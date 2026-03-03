# 🔐 Authentication Setup - Quick Start Guide

## ✅ What's Been Implemented

Your InnerCode app now has complete authentication with:

- ✅ **Landing Page** - Sign up / Log in buttons
- ✅ **Sign Up** - Full registration with first name, last name, country, email, password
- ✅ **Login** - Secure email/password authentication
- ✅ **Welcome Page** - Post-signup with "Reveal the real you" button
- ✅ **Email Verification** - Automatic email confirmation
- ✅ **Timezone Detection** - Auto-set based on country selection
- ✅ **Protected Routes** - Journal/Results locked until onboarding complete
- ✅ **Smart Menu** - Shows locked features with 🔒 icons
- ✅ **Logout** - Available in floating menu
- ✅ **Row-Level Security** - Users only see their own data

## 🚀 Next Steps to Make It Work

### Step 1: Create Supabase Account (5 minutes)

1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up (GitHub/Google recommended for easy setup)
4. Create new organization (if first time)

### Step 2: Create Your Project (2 minutes)

1. Click **"New Project"**
2. Settings:
   - Name: `innercode-app`
   - Database Password: **Save this password!** (you'll need it)
   - Region: Choose closest to you (e.g., US East, EU West)
3. Click **"Create new project"**
4. Wait ~2 minutes for setup ☕

### Step 3: Run Database Setup (2 minutes)

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open `supabase-setup.sql` file from your project
4. Copy ALL the SQL code
5. Paste into Supabase SQL editor
6. Click **RUN** (or Ctrl/Cmd + Enter)
7. Success! ✅ (should see "Success. No rows returned")

### Step 4: Get Your API Keys (1 minute)

1. Click **Settings** (gear icon, bottom left)
2. Click **API** in the sidebar
3. Find these two values:
   - **Project URL**: Copy it
   - **anon public** key: Copy it (under "Project API keys")

### Step 5: Configure Your App (1 minute)

1. In your project folder, create `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in your code editor

3. Paste your credentials:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...your_long_key_here
   ```

4. Save the file

### Step 6: Configure Email (2 minutes)

1. In Supabase, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Settings:
   - ✅ **Enable email confirmations** (ON)
   - ✅ **Confirm email** (ON)
4. Save

### Step 7: Restart Your App

```bash
# Stop the current server (Ctrl + C in terminal)
# Start it again to load new environment variables
npm run dev
```

### Step 8: Test It! 🎉

1. App should open at `http://localhost:3000`
2. You should see the **Landing Page** (not Home anymore!)
3. Click **"Sign Up"**
4. Fill in the form:
   - First Name: Your name
   - Last Name: Your last name
   - Country: Select from dropdown
   - Email: Your email
   - Password: At least 6 characters
   - Confirm Password: Same password
5. Click **"Sign Up"**
6. You should see **Welcome Page**!
7. Check email for verification link (or check Supabase dashboard)

## 📧 Email Verification

### In Development:
- Emails appear in: **Supabase Dashboard** → **Authentication** → **Users**
- Click on your user to see the confirmation link
- Click the link to verify

### For Testing Without Email:
1. Go to **Authentication** → **Settings**
2. Scroll to **Email**
3. Temporarily disable "Enable email confirmations"
4. You can sign up without email verification

### For Production:
- Configure custom SMTP in **Project Settings** → **Auth** → **SMTP Settings**
- Recommended: Resend, SendGrid, or Postmark

## 🔒 Security Features

✅ **Row Level Security** - Users can only access their own data
✅ **Password Hashing** - Automatic with bcrypt
✅ **JWT Tokens** - Secure session management
✅ **Email Verification** - Prevents fake accounts
✅ **HTTPS** - Enforced in production
✅ **Rate Limiting** - Built-in DDoS protection

## 🌍 Timezone Features

The app automatically sets timezone based on country selection:
- US → America/New_York
- UK → Europe/London
- Australia → Australia/Sydney
- And 30+ more countries

This ensures:
- Correct "daily" journal locking (midnight in user's timezone)
- Accurate streak calculations
- Proper date displays

## 📱 User Flow

```
Landing Page
    ↓
[Sign Up] → Email Verification → Welcome → Home → Instructions → Onboarding → Dashboard
    OR
[Log In] → Dashboard (if completed) OR Home (if new)
```

## 🎨 What Users See

**Non-Authenticated Users:**
- Landing page only
- Can't access any features

**Authenticated (Not Onboarded):**
- Can access: Dashboard (empty state), Home, Instructions
- 🔒 Locked: Results, Journal, Calendar

**Authenticated (Onboarding In-Progress):**
- Can access: Continue Onboarding
- Dashboard shows "Continue" banner

**Authenticated (Completed):**
- ✅ All features unlocked
- Full dashboard with stats
- Journaling enabled
- Results visible

## 🔧 Customization

### Change Email Templates:
**Authentication** → **Email Templates** in Supabase

### Add OAuth (Google, GitHub, etc.):
**Authentication** → **Providers** → Enable provider

### Add Profile Picture:
Add `avatar_url` column to `users_profile` table

### Add More Countries:
Edit `src/constants/countries.ts`

### Customize Welcome Message:
Edit `src/pages/Welcome.tsx`

## 🚨 Troubleshooting

### "Invalid API key"
- Check `.env` has correct URL and key
- **Restart dev server** after changing `.env`
- Check no extra spaces in `.env`

### "Table doesn't exist"
- Run `supabase-setup.sql` in SQL Editor
- Verify tables exist: **Database** → **Tables**

### Can't sign up
- Check email format is valid
- Password minimum 6 characters
- Check browser console for errors

### Email not arriving
- Development: Check **Authentication** → **Users** → User details
- Check spam folder
- Verify email provider is configured

### Lost in auth flow
- Open browser console
- Check for errors
- Try signing out: Click menu → Log Out

## 📊 Monitoring Users

View all users in:
**Authentication** → **Users**

You can:
- See all registered users
- Manually verify emails
- Delete users
- Send password reset emails
- View last sign-in time

## 🔄 Data Migration

Your existing data (if any) in localStorage will remain until:
1. User completes onboarding again (new results saved to Supabase)
2. User journals (new entries saved to Supabase)

We're keeping localStorage as fallback for now. In the future, you can migrate old data to Supabase.

## 🌐 Production Deployment

When deploying to Vercel/Netlify:

1. Add environment variables in hosting dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Configure redirect URLs in Supabase:
   - **Authentication** → **URL Configuration**
   - Add your production URL
   - Add redirect URLs

3. Set up custom domain (optional):
   - Configure in your hosting provider
   - Update Supabase redirect URLs

## 📈 Scaling Considerations

**Free Tier Limits:**
- 500MB database
- 50,000 monthly active users
- 2GB file storage
- 50,000 emails/month

**When to upgrade:**
- \>500MB: $25/month (Pro tier)
- Custom SMTP: Free tier has limits
- More bandwidth: Pro tier

## 💡 Next Features to Add

- [ ] Password reset functionality
- [ ] Profile editing page
- [ ] OAuth (Google/Apple sign in)
- [ ] "Remember me" checkbox
- [ ] Two-factor authentication
- [ ] Account deletion
- [ ] Data export (GDPR compliance)

---

## Need Help?

1. **Supabase Docs**: https://supabase.com/docs
2. **Auth Guide**: https://supabase.com/docs/guides/auth
3. **Discord**: https://discord.supabase.com
4. **Issues**: Check browser console first!

**Happy building! 🚀**






