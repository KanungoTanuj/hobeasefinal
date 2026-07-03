# Daily.co to LiveKit Migration Guide

## Overview

This guide provides a step-by-step migration from Daily.co to LiveKit for Hobease. The migration maintains existing functionality while providing better control and security for video sessions.

## Architecture Changes

### Current (Daily.co)
```
Dashboard → VideoCallInterface
  ↓
/api/video/create-room (Daily.co API)
  ↓
Daily.co room URL → Embedded iframe
```

### New (LiveKit)
```
Dashboard → VideoCallInterface (refactored)
  ↓
/api/video/token (Generate JWT)
  ↓
LiveKit SDK → Connect with token
```

## Key Differences

| Aspect | Daily.co | LiveKit |
|--------|----------|---------|
| **Authentication** | URL-based (embeddable) | JWT token-based |
| **Room Creation** | API creates room | Rooms auto-created on first connect |
| **Token Storage** | None (URL is token) | Generated on-demand, expires 30min |
| **Permissions** | Built into URL | Fine-grained in JWT claims |
| **Database** | room_url stored | room_id as LiveKit room name |

## Migration Checklist

- [ ] Step 1: Install LiveKit packages
- [ ] Step 2: Set environment variables
- [ ] Step 3: Run SQL migrations (optional, for analytics)
- [ ] Step 4: Create `/api/video/token` endpoint
- [ ] Step 5: Update VideoCallInterface component
- [ ] Step 6: Update teacher dashboard join flow
- [ ] Step 7: Update learner dashboard join flow
- [ ] Step 8: Test end-to-end (teacher → learner)
- [ ] Step 9: Remove Daily.co code and env vars
- [ ] Step 10: Deploy and monitor

## Step 1: Install LiveKit Packages

```bash
npm install livekit-client @livekit/components-react livekit-server-sdk
```

**Versions:**
- `livekit-client@^0.9.x` - Client SDK
- `@livekit/components-react@^0.9.x` - Pre-built UI components
- `livekit-server-sdk@^0.5.x` - Server-side token generation

## Step 2: Environment Variables

**Add to Vercel project (Settings → Environment Variables):**

```
LIVEKIT_URL=wss://your-livekit-server.example.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.example.com
```

**Where to find these:**
- Create a LiveKit account at https://cloud.livekit.com
- Generate API credentials in the dashboard
- Copy the room service URL (WebSocket URL)

## Step 3: SQL Migrations (Optional)

Run the provided SQL script in your Supabase dashboard to add optional analytics columns:

```sql
-- See scripts/livekit-migration.sql
```

This adds:
- `provider` - Track which video service is used
- `started_at` - When session started
- `ended_at` - When session ended
- `duration_minutes` - Total session duration

**Note:** These are OPTIONAL. The system works without them.

## Step 4: Create Token Endpoint

See `IMPLEMENTATION_GUIDE.md` for the full `/api/video/token` implementation.

Key points:
- Validates Supabase session
- Checks user belongs to class
- Generates 30-min JWT token
- Returns token and room name
- Never stores tokens in database

## Step 5: Replace VideoCallInterface

See `IMPLEMENTATION_GUIDE.md` for the new component.

Key changes:
- Uses LiveKit SDK instead of Daily.co iframe
- Accepts `token` and `roomName` instead of `roomId`
- Implements LiveKitRoomProvider
- Handles participant tiles and screen sharing
- Teacher gets mute/remove/end permissions
- Learner gets basic publish/receive permissions

## Step 6 & 7: Update Dashboards

In **teacher/dashboard/page.tsx** and **learner/dashboard/page.tsx**:

```typescript
// Old
const response = await fetch("/api/video/create-room", {...})
const data = await response.json()
setDailyRoomUrl(data.url)

// New
const response = await fetch("/api/video/token", {...})
const data = await response.json()
setToken(data.token)
setRoomName(data.roomName)
```

Then pass to component:
```tsx
<VideoCallInterface
  token={token}
  roomName={roomName}
  ...
/>
```

## Step 8: Testing

**Test Checklist:**
- [ ] Teacher can start class
- [ ] Learner can join class
- [ ] Audio/video works both ways
- [ ] Screen sharing works
- [ ] Teacher can mute learner
- [ ] Teacher can end class
- [ ] Learner sees "connection closed" when class ends
- [ ] Token expires correctly (30 min)
- [ ] Multiple concurrent classes work

## Step 9: Remove Daily.co

Once tested:
1. Remove `DAILY_API_KEY` and `DAILY_DOMAIN` env vars
2. Delete `app/api/video/create-room/route.ts` (after token endpoint is live)
3. Remove Daily.co API calls from code
4. Remove Daily.co package dependencies

## Step 10: Deploy and Monitor

1. Commit all changes
2. Push to GitHub
3. Verify Vercel deployment
4. Monitor error logs for issues
5. Check LiveKit dashboard for room/participant metrics

## Rollback Plan

If issues arise:
1. Keep both Daily.co and LiveKit endpoints for 1 week
2. Feature-flag the new VideoCallInterface to toggle between implementations
3. Revert deployment if critical issues found

## Troubleshooting

### "Cannot find module 'livekit-client'"
- Run `npm install livekit-client @livekit/components-react livekit-server-sdk`
- Restart dev server

### Token generation fails
- Check `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are set
- Verify token endpoint URL is correct
- Check server logs for specific error

### Connection fails
- Check `NEXT_PUBLIC_LIVEKIT_URL` is set correctly
- Verify LiveKit server is running and accessible
- Check firewall/network doesn't block WebSocket

### Audio/video not working
- Check microphone/camera permissions in browser
- Verify both users have joined the same room
- Check LiveKit server is not overloaded

## Support

For LiveKit documentation, see: https://docs.livekit.io

## Notes

- Tokens expire after 30 minutes. If a class goes longer, the user will be disconnected. Update token expiry in `/api/video/token` if needed.
- The system uses `classes.room_id` as the LiveKit room name (no separate room management needed)
- No database table for tokens (they're generated on-demand for security)
- Consider adding recording if needed (see LiveKit docs for egress configuration)
