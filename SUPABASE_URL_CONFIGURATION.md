# 🔗 Supabase URL Configuration (Fix Email Links)

## Problem: Email Verification Links Don't Work

When you click the verification link in your email, it should bring you back to your app. Here's how to fix it:

## 🔧 Step-by-Step Fix

### 1. Go to Supabase URL Configuration

1. Open Supabase dashboard: https://app.supabase.com
2. Select your InnerCode project
3. Click **Authentication** (left sidebar)
4. Click **URL Configuration** (in the sub-menu)

### 2. Add Your Local Development URL

Find the section called **Redirect URLs** and add:

```
http://localhost:3000
http://192.168.4.27:3000
```

**Why both?**
- `localhost:3000` - For you on your computer
- `192.168.4.27:3000` - For your girlfriend on her phone

### 3. Set Site URL

In the **Site URL** field, enter:
```
http://localhost:3000
```

This is your main app URL.

### 4. Click Save

Click the **Save** button at the bottom.

---

## ✅ What This Does

Now when users click the email verification link:
1. They verify their email ✅
2. They're redirected back to your app at `http://localhost:3000` ✅
3. App detects they're verified ✅
4. They can now access everything! ✅

---

## 🧪 Testing After Configuration

1. **Sign up** with a new email
2. You'll see "Check Your Email" page
3. **Check your email** (or Supabase dashboard → Users → Click user → confirmation link)
4. **Click the verification link**
5. **You should be redirected** to http://localhost:3000
6. App will detect you're verified and show the Welcome page!
7. Click "Reveal the real you" → Now you can proceed! ✅

---

## 🌐 For Production (Later)

When you deploy your app to Vercel/Netlify:

1. Add your production URL to Redirect URLs:
   ```
   https://yourapp.com
   https://www.yourapp.com
   ```

2. Update Site URL to your production URL

3. Keep localhost URLs for development

Example:
```
Site URL: https://innercode.app
Redirect URLs:
  - https://innercode.app
  - https://www.innercode.app
  - http://localhost:3000 (for development)
```

---

## 🔍 Verification Status

Users can check if they're verified:
- Supabase dashboard → Authentication → Users
- Look for green checkmark ✅ next to email

---

## 🚨 Common Issues

### "Invalid redirect URL" error
- Make sure you added the exact URL to Redirect URLs
- Include http:// or https://
- No trailing slash
- Click Save!

### Link redirects but still shows verify page
- Refresh the page (Cmd + R)
- The app should detect verification automatically
- Check browser console for errors

### Link goes to Supabase, not your app
- Check Site URL is set correctly
- Make sure redirectTo is configured in supabase.ts (already done ✅)

---

## 📱 For Your Girlfriend's Phone

Make sure both URLs are in Redirect URLs:
```
http://localhost:3000
http://192.168.4.27:3000
```

When she clicks the email link on her phone:
- It will redirect to the network URL
- She'll be verified
- She can access the app!

---

**Do this now, then test again!** The email verification flow will work perfectly. 🎉






