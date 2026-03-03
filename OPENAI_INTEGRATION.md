# OpenAI Integration Guide

InnerCode now communicates with OpenAI exclusively via a Supabase Edge Function, eliminating the need for browser-side API keys while keeping our existing AI abstraction intact.

## Architecture Overview

```
AICoach / Check-In / Daily Insights
    ↓
aiService (interface)
    ↓
OpenAIService (fetches Supabase Edge Function)
    ↓
Supabase Function `inny-chat`
    ↓
OpenAI API (server-side key)
```

The `StaticAIService` fallback remains available through the `FEATURES.USE_OPENAI` flag.

## Deploying the Supabase Edge Function

1. Ensure you have the Supabase CLI installed (`npm install supabase --global`) and are authenticated (`supabase login`).
2. The function source lives at `supabase/functions/inny-chat/index.ts`.
3. Deploy to your project:

   ```bash
   supabase functions deploy inny-chat
   ```

4. Set the OpenAI secret (required both in production and for local emulation):

   ```bash
   supabase secrets set OPENAI_API_KEY=sk-your-openai-key
   ```

### Local Development

1. Create `supabase/.env` with the following variable (never commit real keys):

   ```
   OPENAI_API_KEY=sk-your-local-test-key
   ```

2. Start the emulator:

   ```bash
   supabase functions serve inny-chat --env-file supabase/.env
   ```

3. Call the function manually to verify connectivity:

   ```bash
   curl --request POST \
     --url http://localhost:54321/functions/v1/inny-chat \
     --header 'Content-Type: application/json' \
     --header 'Authorization: Bearer YOUR_ANON_OR_SERVICE_ROLE_TOKEN' \
     --data '{"message":"Hello Inny"}'
   ```

## Frontend Configuration

The Vite app only needs Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

`OpenAIService` obtains a session token from Supabase and calls `functions/v1/inny-chat`; there is no longer any `VITE_OPENAI_API_KEY` value on the client.

## Troubleshooting Checklist

| Symptom | Fix |
| --- | --- |
| 500 from `/functions/v1/inny-chat` | Confirm `OPENAI_API_KEY` secret exists; inspect logs via `supabase functions logs inny-chat`. |
| Local emulator cannot reach OpenAI | Ensure outbound network access and that `supabase/.env` contains `OPENAI_API_KEY`. |
| Unauthorized response | Verify the frontend is sending a valid Supabase session token and that RLS policies allow invocation. |

## Cost Management

### Pricing
- GPT-4o-mini is the default model: ~$0.15 per 1M input tokens.
- GPT-4o (full): ~$5 per 1M input tokens.

### Optimization Tips

1. **Use GPT-4o-mini for simple tasks** (already configured) and switch to GPT-4o only for premium features.
2. **Cache responses** (store for 24 hours)
   - Same question gets cached answer
   - 90% cost reduction
3. **Rate limiting**
   - Free users: 10 AI messages/day
   - Premium: Unlimited
4. **Smart fallback**
   - If OpenAI fails, fall back to static AI
   - User experience isn't disrupted

## Security Notes

⚠️ **Never** call OpenAI directly from the browser or embed keys in the client bundle. All traffic must flow through the Supabase function.

```typescript
// GOOD: Frontend fetches the Supabase function
const response = await fetch('/functions/v1/inny-chat', { ... });

// BAD: Directly instantiate OpenAI in the browser (key exposed)
const openai = new OpenAI({ apiKey: 'sk-...' });
```

## Rollback

Disable the feature flag and redeploy:

```typescript
// src/constants/featureFlags.ts
USE_OPENAI: false;
```

The app immediately falls back to the static provider.

### Pricing
- GPT-4: ~$0.80/month per active user (estimated)
- Input: $2.50 per 1M tokens
- Output: $10 per 1M tokens

### Optimization Tips

1. **Use GPT-4o-mini for simple tasks** (10x cheaper)
   - Daily Sparks generation
   - Basic pattern detection

2. **Cache responses** (store for 24 hours)
   - Same question gets cached answer
   - 90% cost reduction

3. **Rate limiting**
   - Free users: 10 AI messages/day
   - Premium: Unlimited

4. **Smart fallback**
   - If OpenAI fails, fall back to static AI
   - User experience isn't disrupted

## Security Notes

⚠️ **NEVER** call OpenAI directly from the browser!

❌ BAD:
```typescript
// In browser code - exposes API key!
const openai = new OpenAI({ apiKey: "sk-..." });
```

✅ GOOD:
```typescript
// Call via Supabase Edge Function (server-side)
const response = await fetch('/functions/v1/inny-chat', { ... });
```

## Troubleshooting

### Issue: API key exposed
**Solution:** Make sure all OpenAI calls go through Supabase Edge Function

### Issue: High costs
**Solution:** Implement caching and rate limiting

### Issue: Slow responses
**Solution:** Use GPT-4o-mini for simple queries, GPT-4 for complex

### Issue: Feature not working
**Solution:** Check feature flag is enabled and dependencies installed

## Rollback

If OpenAI causes issues, revert instantly:

```typescript
// In featureFlags.ts
USE_OPENAI: false, // Disable OpenAI
```

App immediately falls back to static AI.

## Need Help?

- OpenAI Docs: https://platform.openai.com/docs
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Open issue on GitHub for questions

