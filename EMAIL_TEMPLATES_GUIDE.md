# 📧 Email Templates Setup Guide

Beautiful, on-brand email templates for your InnerCode app!

## 🎨 What's Included

I've created 4 custom email templates that match your app's design:

1. **confirm-signup.html** - Welcome new users (sign up confirmation)
2. **magic-link.html** - Passwordless login link
3. **change-email.html** - Email change confirmation
4. **reset-password.html** - Password reset

All templates feature:
- 🌿 Your InnerCode logo
- 💜 Purple gradient buttons (#8B5CF6, #7C3AED)
- 🙏 Grateful, warm language
- 📱 Mobile-responsive design
- 🔒 Security notices
- ✨ Beautiful, modern UI

## 📋 How to Add Templates to Supabase

### Step 1: Go to Email Templates

1. Open your Supabase dashboard: https://app.supabase.com
2. Select your InnerCode project
3. Click **Authentication** (left sidebar)
4. Click **Email Templates** (sub-menu)

### Step 2: Update Each Template

You'll see 4 tabs at the top. Update each one:

#### **Confirm Signup Template:**

1. Click the **"Confirm signup"** tab
2. In Cursor, open `email-templates/confirm-signup.html`
3. **Select all** (Cmd + A) and **copy** (Cmd + C)
4. Back in Supabase, **delete** the existing template content
5. **Paste** your new template (Cmd + V)
6. Click **Save** (bottom right)

#### **Magic Link Template:**

1. Click the **"Magic Link"** tab
2. In Cursor, open `email-templates/magic-link.html`
3. **Select all** and **copy**
4. Back in Supabase, **delete** existing content
5. **Paste** your new template
6. Click **Save**

#### **Change Email Address Template:**

1. Click the **"Change Email Address"** tab
2. In Cursor, open `email-templates/change-email.html`
3. **Select all** and **copy**
4. Back in Supabase, **delete** existing content
5. **Paste** your new template
6. Click **Save**

#### **Reset Password Template:**

1. Click the **"Reset Password"** tab
2. In Cursor, open `email-templates/reset-password.html`
3. **Select all** and **copy**
4. Back in Supabase, **delete** existing content
5. **Paste** your new template
6. Click **Save**

## ✅ Testing Your Templates

### Method 1: Preview in Supabase
- After pasting, you can see a preview on the right side
- Make sure it looks good before saving

### Method 2: Send Test Email
1. After saving, try signing up with a test email
2. Check your inbox
3. The email should look beautiful and match your app!

### Method 3: Use Supabase Test Email
- Go to **Authentication** → **Users**
- Click on a user
- Click "Send password reset email"
- Check the formatting

## 🎨 Template Features

### Colors Used:
- **Primary Purple**: `#8B5CF6` and `#7C3AED`
- **Background Gradients**: Purple + Orange tints
- **Text Colors**: Dark grey `#3b3b3b`, Medium `#4b4b4b`, Light `#6b6b6b`
- **Borders**: Subtle with transparency

### Design Elements:
- 🌿 Logo emoji (64px)
- Rounded corners (12-16px border-radius)
- Pill-shaped buttons (999px border-radius)
- Box shadows for depth
- Gradient backgrounds
- Info boxes with icons

### Language Tone:
- ✅ Grateful ("Thank you for choosing...")
- ✅ Warm ("We're happy to see you...")
- ✅ Encouraging ("Keep growing, keep reflecting...")
- ✅ Supportive ("No worries! We all forget...")
- ✅ Privacy-focused ("Your data stays yours")

## 🔧 Customization

Want to change something? Edit the HTML files and re-paste into Supabase.

### Change the Logo:
Replace `🌿` with another emoji or add an `<img>` tag:
```html
<img src="https://yoursite.com/logo.png" alt="InnerCode" style="width: 80px; height: 80px;">
```

### Change Colors:
Find and replace:
- `#8B5CF6` → Your new primary color
- `#7C3AED` → Your new secondary color

### Change Text:
Just edit the `<p>` tags with your preferred wording

### Add Social Links:
Add to the footer:
```html
<a href="https://instagram.com/innercode">Instagram</a>
```

## 📱 Mobile Responsive

All templates use:
- Fluid tables (adapts to screen width)
- Max-width: 600px (perfect for email)
- Padding adjusts on small screens
- Touch-friendly buttons (44px+ height)

## 🚨 Important Variables

These are Supabase template variables - **DON'T CHANGE THEM:**

- `{{ .ConfirmationURL }}` - The actual link/button URL
- `{{ .Token }}` - Token for some templates
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL

Supabase automatically replaces these when sending emails.

## ✉️ Email Subject Lines

You can also customize subject lines in Supabase:

**Confirm signup:**
```
Welcome to InnerCode! Please confirm your email 🌿
```

**Magic Link:**
```
Your InnerCode login link ✨
```

**Change Email:**
```
Confirm your new email address
```

**Reset Password:**
```
Reset your InnerCode password 🔑
```

## 🎯 Best Practices

✅ **Always test** before going live
✅ **Keep it simple** - Email clients are limited
✅ **Use inline styles** - External CSS doesn't work in emails
✅ **Include plain text version** - For accessibility
✅ **Test on mobile** - 60% of emails are opened on mobile
✅ **Check spam score** - Use tools like Mail Tester

## 🔍 Preview Tools

Test your templates:
- **Litmus**: Email testing across clients
- **Email on Acid**: Design testing
- **Mail Tester**: Spam score checker
- **HTML Email**: Free templates for reference

## 🚀 Going Live

Once templates are saved in Supabase:
1. Users will receive beautiful, branded emails
2. Emails match your app design
3. Professional, trustworthy appearance
4. Higher engagement rates!

---

**Your email templates are ready! 🎉** Just copy-paste them into Supabase and you're done!






