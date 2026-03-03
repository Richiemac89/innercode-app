# 🔧 Troubleshooting Guide

## Issue: "Nothing happens when I click Sign Up"

### Quick Fixes:

#### **1. Check Browser Console (MOST IMPORTANT)**

Press **F12** (or **Cmd + Option + I** on Mac) to open Developer Tools:

1. Click the **Console** tab
2. Click "Sign Up" button again
3. Look for error messages (red text)
4. Screenshot and send me the errors

Common errors you might see:
- "Invalid API key" → Check `.env` file
- "Failed to fetch" → Supabase connection issue
- "Network error" → Check internet connection
- Rate limit error → Wait 60 seconds or use different email

---

#### **2. Check Your .env File**

Make sure it exists and has correct values:

```bash
# In terminal:
cat .env
```

Should show:
```
VITE_SUPABASE_URL=https://wkgsaqupkohwxcxmbska.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

If it says "YOUR_SUPABASE_URL" → Not configured!

---

#### **3. Restart Server**

After creating `.env`, you MUST restart:

```bash
# Stop server: Ctrl + C
# Start again:
npm run dev
```

---

#### **4. Clear Browser Cache**

Hard refresh: **Cmd + Shift + R** (Mac) or **Ctrl + Shift + R** (Windows)

Or use Incognito/Private mode

---

#### **5. Check Supabase is Working**

1. Go to: https://app.supabase.com
2. Click your project
3. Check it's green/running (not paused)
4. Go to **Database** → **Tables**
5. Make sure `users_profile` table exists

---

#### **6. Rate Limit Issue?**

If you see "for security purposes, you can only request this after X seconds":

**Solution:** Use different email with **+ trick**:
```
yourname+test1@gmail.com
yourname+test2@gmail.com
yourname+test3@gmail.com
```

All go to the same inbox, but Supabase treats them as different!

---

## Issue: "Email link doesn't redirect to app"

### Fix: Configure Redirect URLs in Supabase

See `SUPABASE_URL_CONFIGURATION.md` for detailed steps.

**Quick version:**
1. Supabase → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   http://localhost:3000
   http://192.168.4.27:3000
   ```
3. Set **Site URL**: `http://localhost:3000`
4. Click **Save**

---

## Issue: "Can't see new features (Dashboard, etc.)"

### Solution: Clear localStorage

Open browser console (F12) and run:
```javascript
localStorage.clear()
location.reload()
```

This resets everything to fresh state.

---

## Issue: "App shows blank screen"

### Checklist:
1. ✅ Server running? (Check terminal for "ready in X ms")
2. ✅ .env file exists with real credentials?
3. ✅ Supabase tables created? (ran SQL script?)
4. ✅ Browser console shows errors? (F12 → Console)
5. ✅ Try different browser?

---

## Issue: "Database errors"

### Common causes:

**"relation users_profile does not exist"**
- You didn't run the SQL script!
- Go to Supabase → SQL Editor
- Copy all from `supabase-setup.sql`
- Paste and click **RUN**

**"permission denied for table"**
- Row Level Security issue
- SQL script should have created policies
- Try running SQL script again

**"duplicate key value"**
- User already exists
- Use different email or delete from Supabase Users

---

## Issue: "My girlfriend can't access on phone"

### Checklist:
1. ✅ Same WiFi network?
2. ✅ Using correct URL: `http://192.168.4.27:3000`
3. ✅ Your computer's firewall allows connections?
4. ✅ Server is running?
5. ✅ Try on your phone first to verify it works

### Test on YOUR phone first:
- Connect to same WiFi
- Open Safari/Chrome
- Go to: `http://192.168.4.27:3000`
- If it works for you, should work for her!

---

## Debugging Commands

### Check if server is running:
```bash
lsof -ti:3000
```
Should show a process ID. If empty, server isn't running.

### Check .env exists:
```bash
ls -la .env
```

### Check Supabase connection:
Open browser console and run:
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
```
Should show your Supabase URL, not "undefined"

### Test Supabase directly:
```javascript
// In browser console
const { data, error } = await supabase.auth.getSession()
console.log('Session:', data, 'Error:', error)
```

---

## Still Stuck?

### Information to Collect:

1. **Browser console errors** (F12 → Console → screenshot)
2. **Network tab** (F12 → Network → filter by "supabase")
3. **What step are you on?** (Landing, Signup, Verify, etc.)
4. **Supabase project status** (green/active?)
5. **Error messages** from any popups or screens

### Where to Get Help:

- Me! Send me the console errors
- Supabase Discord: https://discord.supabase.com
- Supabase Docs: https://supabase.com/docs

---

## Common "Gotchas"

❌ **Forgot to restart server after creating .env**
❌ **Didn't run SQL script in Supabase**
❌ **Didn't configure Redirect URLs**
❌ **Used same email too many times (rate limit)**
❌ **Browser cached old version (need hard refresh)**
❌ **Typo in .env file (extra spaces, wrong URL)**

---

## Quick Health Check

Run this checklist:

- [ ] `.env` file exists with real Supabase credentials
- [ ] Server restarted after creating `.env`
- [ ] SQL script ran successfully in Supabase
- [ ] Redirect URLs configured in Supabase
- [ ] Email provider enabled in Supabase
- [ ] Browser console shows no red errors
- [ ] Using fresh email (with `+test1` if testing)
- [ ] Waited 60 seconds if got rate limit error

---

**Most issues are solved by:**
1. Checking browser console (F12)
2. Restarting the server
3. Hard refreshing browser (Cmd + Shift + R)

Let me know what you find! 🔍






