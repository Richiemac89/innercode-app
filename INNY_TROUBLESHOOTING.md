# Inny Chat Troubleshooting Guide

## ✅ Fixes Applied

1. **Timeout Protection**: Added 30-second timeout to prevent infinite hanging
2. **Defensive Checks**: Added null/undefined checks to prevent crashes from missing context data
3. **Better Error Handling**: Improved error messages to help diagnose issues

## 🔍 Diagnostic Steps

### Step 1: Check Browser Console
Open your browser's developer console (F12) and look for these logs when you try to chat with Inny:

- ✅ `invokeInnyChat: request started` - Request is being sent
- ❌ `invokeInnyChat: Supabase function error` - Function call failed (check error details)
- ❌ `invokeInnyChat: Request timed out` - Function didn't respond within 30 seconds
- ❌ `invokeInnyChat: empty reply received` - Function responded but no reply

### Step 2: Verify Supabase Configuration

Check that your environment variables are set:
- `VITE_SUPABASE_URL` - Should be `https://YOUR_PROJECT_REF.supabase.co`
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

You can check these in the browser console:
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
```

### Step 3: Deploy the Supabase Edge Function

The function needs to be deployed to your Supabase project:

#### Install Supabase CLI (if not installed):
```bash
npm install -g supabase
```

#### Login to Supabase:
```bash
supabase login
```

#### Link to your project:
```bash
cd innercode-app
supabase link --project-ref YOUR_PROJECT_REF
```
(Find your project ref in your Supabase dashboard URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`)

#### Deploy the function:
```bash
supabase functions deploy inny-chat
```

### Step 4: Set OpenAI API Key Secret

The function needs your OpenAI API key to work:

```bash
supabase secrets set OPENAI_API_KEY=sk-your-actual-openai-api-key
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

### Step 5: Verify Function is Deployed

Check if the function is deployed:
```bash
supabase functions list
```

Should show `inny-chat` in the list.

### Step 6: Check Function Logs

View recent logs to see what's happening:
```bash
supabase functions logs inny-chat --tail
```

## 🐛 Common Issues

### Issue: "Request timed out"
**Cause**: Function not deployed or not responding
**Fix**: Deploy the function (Step 3) and ensure it's working

### Issue: "Service misconfigured"
**Cause**: OpenAI API key not set
**Fix**: Set the secret (Step 4)

### Issue: "Supabase function error" with 404
**Cause**: Function not deployed
**Fix**: Deploy the function (Step 3)

### Issue: "Supabase function error" with 401/403
**Cause**: Authentication issue
**Fix**: Check that user is logged in and session is valid

### Issue: Inny types but never responds
**Cause**: Function hanging (now fixed with timeout)
**Fix**: After timeout fix, you'll see an error message instead of hanging

## 🧪 Test the Function Manually

Once deployed, you can test it directly:

```bash
curl --request POST \
  --url https://YOUR_PROJECT_REF.supabase.co/functions/v1/inny-chat \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --data '{"messages":[{"role":"user","content":"Hello"}]}'
```

Should return:
```json
{"reply":"Hello! How can I help you today? 💚"}
```

## 📝 Next Steps

1. Apply the timeout fix (already done ✅)
2. Deploy the Supabase function (Step 3)
3. Set the OpenAI API key (Step 4)
4. Test in the app
5. Check browser console for any errors

## 💡 Quick Test

After deploying, try chatting with Inny and check:
- Browser console for logs
- Network tab for the function call
- Function logs for server-side errors

If you see "Request timed out" after 30 seconds, the function is likely not deployed or not responding. Check the deployment status and logs.

