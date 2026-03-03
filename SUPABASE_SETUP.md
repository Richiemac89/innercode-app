# Supabase Setup Guide for InnerCode

This guide will help you set up Supabase authentication and database for your InnerCode app.

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email

## Step 2: Create a New Project

1. Click "New Project"
2. Choose your organization (or create one)
3. Fill in project details:
   - **Project Name**: innercode-app (or your preference)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

## Step 3: Get Your API Credentials

1. In your Supabase dashboard, go to **Settings** (gear icon)
2. Click **API** in the sidebar
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string)

## Step 4: Configure Your App

1. In your project folder, create a file named `.env`:
   ```bash
   # In terminal:
   cp .env.example .env
   ```

2. Open `.env` and paste your credentials:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your_long_anon_key_here
   ```

3. **IMPORTANT**: Never commit `.env` to git! It's already in `.gitignore`.

## Step 5: Set Up Database Tables

1. In Supabase dashboard, click **SQL Editor** in the sidebar
2. Click **New query**
3. Open the file `supabase-setup.sql` from your project
4. Copy all the SQL code
5. Paste it into the Supabase SQL editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. You should see "Success. No rows returned"

This creates:
- ✅ `users_profile` table (name, country, timezone)
- ✅ `user_results` table (assessment results with structured columns)
- ✅ `journal_entries` table (individual journal entries)
- ✅ `user_onboarding_state` table (cached onboarding progress)
- ✅ `user_onboarding_answers` table (per-question responses)
- ✅ `user_daily_insights` table (AI insights and dismissals)
- ✅ Row Level Security policies (privacy!)
- ✅ Indexes & triggers for performance and freshness

## Step 6: Configure Email Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Email** provider
3. Make sure it's **enabled**
4. Configure email settings:
   - **Enable email confirmations**: ON (recommended)
   - **Double confirm email changes**: ON (security)

### Email Templates (Optional but Recommended)

1. Go to **Authentication** → **Email Templates**
2. Customize these templates:
   - **Confirm signup** - Welcome message
   - **Magic Link** - For passwordless login
   - **Change Email Address** - Confirmation
   - **Reset Password** - Password reset

You can add your branding, logo, and custom messaging!

## Step 7: Test Email Delivery (Development)

In development, Supabase shows emails in the **Authentication** → **Users** section:

1. Sign up a test user
2. Go to **Authentication** → **Users**
3. Click on the user
4. See the confirmation link

For production, you may want to configure a custom SMTP provider:
- Go to **Project Settings** → **Auth** → **SMTP Settings**

## Step 8: Restart Your App

```bash
# Stop the current dev server (Ctrl + C)
# Start it again to load the new .env variables
npm run dev
```

## Step 9: Test Authentication

1. Go to your app: `http://localhost:3000`
2. You should see the Landing page
3. Click "Sign Up"
4. Fill in the form with test data
5. Submit
6. Check Supabase dashboard → Authentication → Users
7. You should see your new user!

## Troubleshooting

### Error: "Invalid API key"
- Check your `.env` file has correct credentials
- Restart the dev server after changing `.env`
- Make sure you're using `VITE_` prefix for Vite apps

### Error: "relation users_profile does not exist"
- Re-run the latest `supabase-setup.sql` in the SQL Editor
- Check **Database** → **Tables** to verify tables exist and the shield icon (RLS) is enabled
- If the table exists but REST still fails, inspect **Project Settings → Logs → API** for policy errors

### REST request returns 401 / 403 / 406
- Ensure the client is authenticated (a valid Supabase session or service role key)
- Confirm the REST path uses the new table names (`journal_entries`, `user_onboarding_answers`, etc.)
- Verify that the payload includes `user_id` that matches `auth.uid()`
- Run `select auth.uid();` in the SQL Editor while signed in to double-check the UUID value
- Open **Authentication → Users → {User}** and confirm the UUID matches the request payload

### REST request returns 422 or missing column errors
- Re-run `supabase-setup.sql` to apply the latest columns and indexes
- Send arrays and JSON bodies using valid JSON (not stringified JSON strings)
- Use ISO timestamps (`new Date().toISOString()`) when providing custom `created_at` values
- Check the Supabase API logs for the precise validation error message

### Email not sending
- Development: Check Authentication → Users → Email link
- Production: Configure SMTP settings
- Check spam folder

### Can't sign in after signup
- Email confirmation might be required
- Check Supabase → Authentication → Users → Click user → Send confirmation email
- Or disable email confirmation temporarily in Auth settings

## Security Checklist

✅ Row Level Security enabled on all tables
✅ Users can only access their own data
✅ Environment variables not committed to git
✅ Email confirmation enabled (prevents spam)
✅ Strong password requirements (min 6 chars)

## Optional: Custom Domain Email

For production, you may want custom email (noreply@yourapp.com):

1. Use SendGrid, Resend, or Postmark
2. Configure in Supabase: Project Settings → Auth → SMTP Settings
3. Add sender email, SMTP credentials
4. Test email delivery

## Production Deployment

When deploying to Vercel/Netlify:

1. Add environment variables in hosting dashboard
2. `VITE_SUPABASE_URL` = your Supabase URL
3. `VITE_SUPABASE_ANON_KEY` = your anon key
4. Deploy!

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Authentication Guide: https://supabase.com/docs/guides/auth

---

**You're all set! 🎉** Your app now has secure authentication with privacy-first database storage.






