# LiveKit Migration - Complete Setup Guide

## ✅ What's Done (I handled everything)

### Code Changes Completed
- ✅ Updated `components/video-call-interface.tsx` to use LiveKit SDK
- ✅ Installed `livekit-client` package
- ✅ Updated video component to request tokens from `/api/video/token`
- ✅ Deprecated old `/api/video/create-room` endpoint
- ✅ Token endpoint already exists and generates 30-min JWT tokens
- ✅ Both teacher and learner dashboards already use correct props

### Files Modified
1. `components/video-call-interface.tsx` - Complete rewrite with LiveKit
2. `app/api/video/create-room/route.ts` - Now returns 410 deprecation notice
3. `scripts/livekit-migration.sql` - Optional migration script
4. `LIVEKIT_SETUP.md` - Setup and troubleshooting guide

### Deployments
- ✅ All code committed to `supabase-password-security` branch
- ✅ Pushed to GitHub - Vercel will auto-deploy when merged to main

---

## ⚠️ What You Need to Do (Only 3 Steps!)

### Step 1: Set Environment Variables in Vercel

Go to: **Project Settings > Environment Variables**

Add these THREE variables:

```
Name: LIVEKIT_API_KEY
Value: [your-api-key-from-livekit-cloud]

Name: LIVEKIT_API_SECRET
Value: [your-api-secret-from-livekit-cloud]

Name: NEXT_PUBLIC_LIVEKIT_URL
Value: [your-livekit-url-like-https://your-domain.livekit.cloud]
```

**How to get these:**
1. Go to [LiveKit Cloud Dashboard](https://cloud.livekit.io)
2. Create a new project (if you don't have one)
3. Copy the API Key and Secret
4. Copy the WebRTC URL (it's your server URL)

### Step 2: (OPTIONAL) Run SQL Migration

If you want to track call analytics, run this in your Supabase SQL editor:

```sql
-- OPTIONAL: Add analytics columns to classes table
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'livekit' CHECK (provider IN ('livekit', 'daily')),
ADD COLUMN IF NOT EXISTS call_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS call_ended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS call_duration_seconds INTEGER;

COMMENT ON COLUMN public.classes.provider IS 'Video provider: livekit (new) or daily (legacy)';
COMMENT ON COLUMN public.classes.call_started_at IS 'When the video call actually started';
COMMENT ON COLUMN public.classes.call_ended_at IS 'When the video call ended';
COMMENT ON COLUMN public.classes.call_duration_seconds IS 'Total call duration in seconds';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_provider ON public.classes(provider);
CREATE INDEX IF NOT EXISTS idx_classes_call_started_at ON public.classes(call_started_at DESC);
```

**Note:** This SQL is OPTIONAL. The system works without it - it only adds tracking columns.

### Step 3: Deploy

Merge `supabase-password-security` branch to `main` and push:

```bash
git merge supabase-password-security
git push origin main
```

Vercel will auto-deploy with the new environment variables.

---

## 🚀 Testing After Deployment

### Quick Test in Browser

1. Deploy is complete when you see green checkmark in Vercel
2. Log in to hobease.com
3. As a teacher: Click "Start Video Call" on any booking
4. Should see video conference loading
5. As a learner: Join the same booking
6. Both should see each other in video

### Check Logs if Issues

Look for `[v0]` messages in browser console to see:
- Token generation status
- Room connection status
- Any permission errors

---

## 📊 How It Works Now

### Token Flow
```
1. User clicks "Start Video Call"
   ↓
2. Frontend calls POST /api/video/token
   - Sends: classId
   ↓
3. Backend generates JWT token
   - Valid for 30 minutes
   - Includes user role (teacher/learner)
   - No database storage
   ↓
4. Frontend receives token
   ↓
5. Frontend connects to LiveKit with token
   - Uses NEXT_PUBLIC_LIVEKIT_URL
   - Room name = classes.room_id (existing column!)
   ↓
6. Video call works! ✨
```

### Key Differences from Daily.co

| Feature | Daily.co | LiveKit |
|---------|----------|---------|
| Room Creation | API call | Automatic |
| Authentication | URL-based | JWT Token |
| Token Expiry | Long-lived | 30 minutes |
| Database Storage | None | None |
| Native WebRTC | No (iframe) | Yes |
| Screenshare | Yes | Yes |
| Chat | Built-in | Requires plugin |

---

## 🔐 Security Notes

✅ **Tokens never stored** - Generated on-demand, expire after 30 minutes
✅ **Access control** - Backend verifies user is in the class
✅ **Role-based** - Teachers and learners have appropriate permissions
✅ **No hardcoded secrets** - All via environment variables

---

## 📝 SQL Migration Script (Run in Supabase Dashboard)

If you want to add the optional analytics columns, copy and run this:

```sql
-- ============================================================================
-- LiveKit Migration Script for Hobease
-- OPTIONAL: Analytics columns only - system works without these
-- ============================================================================

-- Add optional analytics columns to classes table
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'livekit' CHECK (provider IN ('livekit', 'daily')),
ADD COLUMN IF NOT EXISTS call_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS call_ended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS call_duration_seconds INTEGER;

-- Add helpful comments
COMMENT ON COLUMN public.classes.provider IS 'Video provider: livekit (new) or daily (legacy)';
COMMENT ON COLUMN public.classes.call_started_at IS 'When the video call actually started';
COMMENT ON COLUMN public.classes.call_ended_at IS 'When the video call ended';
COMMENT ON COLUMN public.classes.call_duration_seconds IS 'Total call duration in seconds';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_classes_provider ON public.classes(provider);
CREATE INDEX IF NOT EXISTS idx_classes_call_started_at ON public.classes(call_started_at DESC);
```

**To run this:**
1. Go to Supabase Dashboard > SQL Editor
2. Paste the script above
3. Click "Run"

---

## 🆘 Troubleshooting

### Issue: "Video service not configured"
**Cause:** Missing environment variables
**Fix:** 
1. Add all 3 env vars to Vercel (LIVEKIT_API_KEY, LIVEKIT_API_SECRET, NEXT_PUBLIC_LIVEKIT_URL)
2. Wait for Vercel to redeploy
3. Refresh the page

### Issue: "Connection Error" in video call
**Cause:** Wrong NEXT_PUBLIC_LIVEKIT_URL or LiveKit instance not running
**Fix:**
1. Verify URL is correct in Vercel env vars
2. Test URL in browser - it should load LiveKit dashboard
3. Restart LiveKit instance if needed

### Issue: "You don't have access to this class"
**Cause:** User ID doesn't match teacher_id or student_id in database
**Fix:**
1. Check that user is logged in with correct account
2. Verify booking exists and user is assigned
3. Check auth user ID matches Teachers or learners table

### Issue: Still seeing Daily.co errors in logs
**Cause:** Old endpoint being called somewhere
**Fix:**
1. Check browser console for fetch to `/api/video/create-room`
2. Old endpoint now returns 410 (deprecated)
3. Component automatically uses `/api/video/token` instead

---

## ✨ Summary

**You need to do 3 things:**
1. ✅ Add 3 environment variables to Vercel
2. ✅ (Optional) Run SQL migration for analytics
3. ✅ Deploy to production

**That's it!** All code is done, all dependencies installed, everything ready to go.

---

## 📞 Quick Checklist

- [ ] Get LiveKit API credentials from cloud.livekit.io
- [ ] Add LIVEKIT_API_KEY to Vercel
- [ ] Add LIVEKIT_API_SECRET to Vercel  
- [ ] Add NEXT_PUBLIC_LIVEKIT_URL to Vercel
- [ ] (Optional) Run SQL migration in Supabase
- [ ] Deploy to main branch
- [ ] Wait for Vercel deployment ✅
- [ ] Test a video call
- [ ] Celebrate! 🎉

Need help? Check `LIVEKIT_SETUP.md` in the repo for more details.
