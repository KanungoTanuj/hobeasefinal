# LiveKit Migration Guide - Hobease

## Overview
This document guides you through the LiveKit migration. The migration is **simple** - no database schema changes required, no token storage needed.

## What Changed

### Before (Daily.co)
```
1. User clicks "Start Video Call"
2. Component calls /api/video/create-room
3. Daily.co API creates a room
4. Browser loads Daily.co iframe
```

### After (LiveKit)
```
1. User clicks "Start Video Call"
2. Component calls /api/video/token
3. Server generates JWT token (30 min expiry)
4. Browser connects to LiveKit room with token
```

## Setup Steps

### Step 1: Set Environment Variables in Vercel

Add these to your Vercel project (Settings > Environment Variables):

```
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
NEXT_PUBLIC_LIVEKIT_URL=https://your-livekit-domain.com
```

How to get these:
1. Go to [LiveKit Cloud](https://cloud.livekit.io)
2. Create a new project
3. Copy the API Key, Secret, and WebRTC URL

### Step 2: Database Migration (OPTIONAL)

The existing `classes` table works as-is. The `room_id` column is reused for LiveKit.

If you want to add analytics columns:
```bash
# Run the SQL script in your Supabase dashboard:
# scripts/livekit-migration.sql
```

**No SQL required to function** - analytics columns are optional only.

### Step 3: Verify Environment Variables

The code is already updated. Just verify these env vars are set:
- `LIVEKIT_API_KEY` ✓
- `LIVEKIT_API_SECRET` ✓
- `NEXT_PUBLIC_LIVEKIT_URL` ✓

### Step 4: Deploy

Push to your `main` branch:
```bash
git push origin main
```

Vercel will auto-deploy with the new environment variables.

## Key Features

✅ **No token storage** - Tokens generated on-demand, expire after 30 minutes
✅ **Secure role-based permissions** - Teachers and learners have different capabilities
✅ **Automatic room reuse** - Uses existing `classes.room_id` as room name
✅ **Zero downtime** - Old Daily.co endpoint returns 410 if accidentally called
✅ **Better performance** - No iframe overhead, native WebRTC

## Testing

### Test the Token Generation
```bash
curl -X POST http://localhost:3000/api/video/token \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "test-class-id",
    "roomName": "test-room"
  }'
```

Expected response:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLC...",
  "roomName": "test-room",
  "identity": "user-id",
  "userName": "User Name"
}
```

### Test in the App
1. Log in as a teacher
2. Click "Start Video Call" on any booking
3. Should see video conference interface loading
4. Both teacher and learner should be able to see each other

## Troubleshooting

### "Video service not configured"
- Check that env vars are set in Vercel: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- Redeploy after adding env vars

### "Failed to generate access token"
- Verify `LIVEKIT_API_SECRET` is correct (check in LiveKit Cloud dashboard)
- Token endpoint should return a valid JWT

### "Connection Error" in video call
- Verify `NEXT_PUBLIC_LIVEKIT_URL` is correct
- Check that your LiveKit instance is running
- Verify firewall/network allows WebRTC connections

### Still seeing Daily.co in logs
- Old endpoint is at `/api/video/create-room` - it returns 410 error now
- Remove any references to it if you have custom code

## Files Changed

```
✅ components/video-call-interface.tsx
   - Replaced Daily.co iframe with LiveKit components
   - Uses new token-based authentication
   
✅ app/api/video/token/route.ts
   - Already exists, generates JWT tokens
   - Validates user access to class
   
✅ app/api/video/create-room/route.ts
   - Deprecated (returns 410 error)
   
✅ scripts/livekit-migration.sql
   - Optional analytics columns only
```

## Rollback (if needed)

To go back to Daily.co:
1. Revert to previous commit
2. Remove LiveKit env vars
3. Redeploy

## Support

If you encounter issues:
1. Check console logs for `[v0]` debug messages
2. Verify all 3 LiveKit env vars are set
3. Check LiveKit Cloud dashboard for room/recording activity
4. Review `/api/video/token` endpoint response

## Next Steps

- **Step 1**: Set the 3 LiveKit environment variables in Vercel
- **Step 2** (Optional): Run the SQL migration if you want analytics
- **Step 3**: Deploy to production
- **Step 4**: Test a video call
