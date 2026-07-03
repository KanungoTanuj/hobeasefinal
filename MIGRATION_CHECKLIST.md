# LiveKit Migration Checklist

## Pre-Migration
- [ ] Create LiveKit account at https://cloud.livekit.com
- [ ] Generate API Key and Secret from LiveKit dashboard
- [ ] Get WebSocket URL from LiveKit dashboard
- [ ] Have Supabase credentials ready
- [ ] Have GitHub access to push changes

## Phase 1: Setup (30 min)

### Install Dependencies
```bash
npm install livekit-client @livekit/components-react livekit-server-sdk
```
- [ ] livekit-client installed
- [ ] @livekit/components-react installed
- [ ] livekit-server-sdk installed
- [ ] Verify `package.json` has all three packages

### Set Environment Variables

In Vercel Dashboard (Settings → Environment Variables):
```
LIVEKIT_URL=wss://your-livekit-server.example.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.example.com
```

- [ ] LIVEKIT_URL set in Vercel
- [ ] LIVEKIT_API_KEY set in Vercel
- [ ] LIVEKIT_API_SECRET set in Vercel
- [ ] NEXT_PUBLIC_LIVEKIT_URL set in Vercel
- [ ] Restart local dev server with `npm run dev`

### Optional: Run SQL Migration

In Supabase Dashboard SQL Editor:
```sql
-- Run the script from scripts/livekit-migration.sql
-- This adds optional analytics columns
```

- [ ] SQL migration executed (optional)
- [ ] `provider` column added to classes table (optional)
- [ ] `started_at` and `ended_at` columns added (optional)

## Phase 2: Create Token Endpoint (30 min)

### Create `/api/video/token/route.ts`

Copy the provided token endpoint code to:
- [ ] File created at `app/api/video/token/route.ts`
- [ ] Imports are correct (AccessToken from livekit-server-sdk)
- [ ] Token generation logic validated
- [ ] Error handling in place

### Test Token Endpoint

```bash
# In a test tool (Postman, curl, etc.)
curl -X POST http://localhost:3000/api/video/token \
  -H "Content-Type: application/json" \
  -d '{"classId":"test-id","roomName":"test-room"}'
```

- [ ] Endpoint returns 200 with token
- [ ] Token is valid JWT
- [ ] Token includes roomName in response
- [ ] Token generation takes < 1 second

## Phase 3: Update VideoCallInterface (1 hour)

### Backup Old Component
```bash
cp components/video-call-interface.tsx components/video-call-interface-daily.tsx
```
- [ ] Old component backed up

### Deploy New Component

Copy the LiveKit implementation to:
- [ ] File created at `components/video-call-interface.tsx` (replace old)
- [ ] Imports are correct (@livekit/components-react)
- [ ] Props interface matches old component
- [ ] Error handling implemented

### Verify Component Functionality
- [ ] Component accepts token and roomName
- [ ] Loading state shows while connecting
- [ ] Error state displays errors
- [ ] End call button visible
- [ ] Fullscreen button works

## Phase 4: Update Teacher Dashboard (1 hour)

**File:** `app/teacher/dashboard/page.tsx`

### Find handleStartClass Function
- [ ] Located `handleStartClass` function
- [ ] Found current Daily.co fetch call

### Replace API Call

```typescript
// OLD:
const response = await fetch("/api/video/create-room", {...})

// NEW:
const response = await fetch("/api/video/token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ classId, roomName })
})
```

- [ ] Replaced API endpoint URL
- [ ] Updated request body for new endpoint
- [ ] Verify roomName is passed correctly

### Update State Management

```typescript
// OLD:
const [dailyRoomUrl, setDailyRoomUrl] = useState<string>("")

// NEW:
const [token, setToken] = useState<string>("")
const [roomName, setRoomName] = useState<string>("")
```

- [ ] Added token state
- [ ] Added roomName state (or renamed from activeRoomId)
- [ ] Removed dailyRoomUrl state references

### Update VideoCallInterface Props

```typescript
<VideoCallInterface
  token={token}
  roomName={roomName}
  classId={activeClassId!}
  userName={teacher?.name || "Teacher"}
  userRole="teacher"
  onEndCall={handleEndCall}
  isOpen={isVideoCallOpen}
  onClose={() => setIsVideoCallOpen(false)}
/>
```

- [ ] Props updated to use token instead of URL
- [ ] roomName prop added
- [ ] All required props provided
- [ ] No undefined values

### Test Teacher Flow

- [ ] Log in as teacher
- [ ] Navigate to dashboard
- [ ] View bookings list
- [ ] Click "Start Class"
- [ ] Token endpoint called successfully
- [ ] VideoCallInterface appears
- [ ] Can see "Connected" status
- [ ] Can end call

## Phase 5: Update Learner Dashboard (1 hour)

**File:** `app/learner/dashboard/page.tsx`

### Find handleJoinClass Function
- [ ] Located `handleJoinClass` function
- [ ] Found current Daily.co fetch call

### Replace API Call

```typescript
// OLD:
const response = await fetch("/api/video/create-room", {...})

// NEW:
const response = await fetch("/api/video/token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ classId: activeClassId, roomName: activeRoomId })
})
```

- [ ] Replaced API endpoint URL
- [ ] Updated request body
- [ ] Verify classId and roomName are correct

### Update State Management

```typescript
// OLD:
const [dailyRoomUrl, setDailyRoomUrl] = useState<string>("")

// NEW:
const [token, setToken] = useState<string>("")
// roomName already exists as activeRoomId
```

- [ ] Added token state
- [ ] Removed dailyRoomUrl state references

### Update VideoCallInterface Props

```typescript
<VideoCallInterface
  token={token}
  roomName={activeRoomId!}
  classId={activeClassId!}
  userName={learner?.name || "Learner"}
  userRole="learner"
  onEndCall={handleEndCall}
  isOpen={isVideoCallOpen}
  onClose={() => setIsVideoCallOpen(false)}
/>
```

- [ ] Props updated to use token
- [ ] roomName is activeRoomId
- [ ] All required props provided

### Test Learner Flow

- [ ] Log in as learner
- [ ] Navigate to dashboard
- [ ] View bookings list
- [ ] Click "Join Class"
- [ ] Token endpoint called successfully
- [ ] VideoCallInterface appears
- [ ] Can join ongoing class
- [ ] Can end call

## Phase 6: Integration Testing (1 hour)

### Test Scenarios

#### Scenario 1: Teacher Starts, Learner Joins
- [ ] Teacher dashboard loads
- [ ] Teacher clicks "Start Class"
- [ ] Token endpoint called
- [ ] VideoCallInterface loads
- [ ] Teacher can see own video feed
- [ ] Learner dashboard shows active class
- [ ] Learner clicks "Join Class"
- [ ] Learner token endpoint called
- [ ] Learner sees teacher's video
- [ ] Teacher sees learner's video
- [ ] Audio works bidirectional

#### Scenario 2: Audio/Video Controls
- [ ] Mute button works on both sides
- [ ] Camera toggle works on both sides
- [ ] Teacher can mute learner (if implemented)
- [ ] Screen share available (if enabled)
- [ ] Participants list shows both users

#### Scenario 3: Call End
- [ ] Teacher clicks "End Call"
- [ ] Class end API endpoint called
- [ ] Learner gets disconnected
- [ ] Both participants removed from room
- [ ] Dashboard updates status

#### Scenario 4: Token Expiry
- [ ] Start class
- [ ] Wait 30+ minutes (or modify token TTL for testing)
- [ ] Verify automatic disconnect
- [ ] Verify error message

#### Scenario 5: Error Scenarios
- [ ] Disconnect internet → shows error
- [ ] Close dialog → ends call
- [ ] Refresh page → maintains connection (if LiveKit supports)
- [ ] Multiple concurrent classes work independently

## Phase 7: Cleanup (30 min)

### Remove Daily.co Code
- [ ] Delete `app/api/video/create-room/route.ts`
- [ ] Delete `components/video-call-interface-daily.tsx` (backup copy)
- [ ] Remove Daily.co imports from dashboards
- [ ] Search for remaining "daily" references → 0 results

### Clean Environment
- [ ] Remove `DAILY_API_KEY` env var from Vercel
- [ ] Remove `DAILY_DOMAIN` env var from Vercel
- [ ] Verify LiveKit env vars are still set
- [ ] Restart dev server

### Update Documentation
- [ ] Add note to README about LiveKit
- [ ] Remove Daily.co references from docs
- [ ] Update deployment guide
- [ ] Link to LIVEKIT_MIGRATION.md for reference

## Phase 8: Deploy to Production (30 min)

### Pre-Deployment Testing
- [ ] All local tests passing
- [ ] No console errors
- [ ] No type errors (`npm run build` succeeds)
- [ ] Lint passing (`npm run lint`)

### Deploy to Staging (if available)
- [ ] Build successfully in CI
- [ ] Staging environment loads
- [ ] Test with real LiveKit server
- [ ] Monitor for errors in Vercel logs

### Deploy to Production
- [ ] Create PR with all changes
- [ ] Code review completed
- [ ] Merge to main branch
- [ ] Vercel deployment triggered
- [ ] Deployment successful
- [ ] Production site loads without errors
- [ ] Monitor error rates for 30 minutes

### Post-Deployment Verification
- [ ] Live metrics in LiveKit dashboard showing rooms
- [ ] Teacher can start class
- [ ] Learner can join class
- [ ] Audio/video works
- [ ] End call works
- [ ] No errors in Vercel logs
- [ ] No errors in browser console
- [ ] Response times acceptable

## Phase 9: Monitoring & Optimization (Ongoing)

### Monitor Metrics
- [ ] Check LiveKit dashboard daily
- [ ] Monitor room creation success rate
- [ ] Monitor connection failures
- [ ] Track average session duration
- [ ] Monitor bandwidth usage

### Performance Optimization
- [ ] Check WebRTC stats in browser
- [ ] Monitor CPU usage during calls
- [ ] Check memory usage
- [ ] Monitor network latency
- [ ] Optimize if needed (bitrate, codec, etc.)

### User Feedback
- [ ] Collect feedback from teachers
- [ ] Collect feedback from learners
- [ ] Address any issues reported
- [ ] Document lessons learned

## Rollback Plan

If critical issues occur:

1. [ ] Revert to Daily.co backup component
2. [ ] Revert dashboard changes
3. [ ] Remove LiveKit dependencies
4. [ ] Re-enable Daily.co API endpoints
5. [ ] Restore Daily.co env variables
6. [ ] Deploy rollback version
7. [ ] Verify connection restored

## Sign-Off

- [ ] All phases completed
- [ ] All tests passing
- [ ] Production deployment successful
- [ ] No blocking issues identified
- [ ] Team sign-off obtained
- [ ] Documentation updated

---

## Important Dates

- **Migration Start:** _________________
- **Testing Complete:** _________________
- **Production Deploy:** _________________
- **30-Day Review:** _________________

## Contact & Support

- **LiveKit Docs:** https://docs.livekit.io
- **LiveKit Support:** support@livekit.io
- **Internal Contact:** _________________
- **Escalation Contact:** _________________

---

**Notes:**
- Keep backups of old components for at least 1 week
- Monitor error logs closely in first 48 hours post-launch
- Have rollback plan ready
- Communicate status to stakeholders
