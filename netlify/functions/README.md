# Netlify Functions

This directory contains Netlify serverless functions for the Product Color Viewer application.

## Keep-Alive Function

**File**: `keep-alive.ts`

### Purpose
Prevents the Supabase free tier database from pausing due to inactivity by making periodic lightweight queries.

### Schedule
Runs **3 times per week** (Monday, Wednesday, Friday) at **9:00 AM UTC**.

### How It Works
1. Executes a lightweight `COUNT` query on the articles table
2. No data writes or modifications
3. Just keeps the database connection active
4. Logs results for monitoring

### Configuration
Configured in `netlify.toml`:
```toml
[functions.keep-alive]
  schedule = "0 9 * * 1,3,5"  # Mon, Wed, Fri at 9 AM UTC
```

### Environment Variables Required
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Cost
- **Free** - Well within Netlify's free tier limits (125k invocations/month)
- Only runs 3x per week = 12-15 executions per month

### Monitoring
Check execution logs in Netlify dashboard:
- Functions → keep-alive → Logs

### Manual Testing
You can manually trigger the function to test:
```bash
# Using Netlify CLI
netlify functions:invoke keep-alive
```

---

## Deployment Notes

1. Environment variables must be set in Netlify dashboard
2. The function will automatically run on the scheduled days
3. No user interaction required - fully automatic
4. Works even when no users are on the website

