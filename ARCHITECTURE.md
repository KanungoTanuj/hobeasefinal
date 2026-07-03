# LiveKit Architecture for Hobease

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOBEASE PLATFORM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐              ┌──────────────────────┐    │
│  │   TEACHER APP   │              │    LEARNER APP       │    │
│  │  (Dashboard)    │              │   (Dashboard)        │    │
│  └────────┬────────┘              └──────────┬───────────┘    │
│           │                                   │                │
│           │ 1. Click "Start Class"    1. Click "Join Class"   │
│           │                                   │                │
│           └─────────────┬───────────────────┘                  │
│                         │                                       │
│                   ┌─────▼──────┐                                │
│                   │ NEXT.JS APP│                                │
│                   │  (Frontend) │                                │
│                   └─────┬──────┘                                │
│                         │                                       │
│            2. POST /api/video/token                           │
│                         │                                       │
│                   ┌─────▼──────────────────────┐               │
│                   │     BACKEND (Node.js)      │               │
│                   │  /api/video/token          │               │
│                   │  - Validate session        │               │
│                   │  - Check class membership  │               │
│                   │  - Generate JWT token      │               │
│                   │  - Return token            │               │
│                   └─────┬──────────────────────┘               │
│                         │                                       │
│                   ┌─────▼──────────────────────┐               │
│                   │    LIVEKIT SDK             │               │
│                   │ (livekit-server-sdk)       │               │
│                   │ Generates JWT tokens       │               │
│                   └─────┬──────────────────────┘               │
│                         │                                       │
│          3. Return token to frontend                           │
│                         │                                       │
│                   ┌─────▼──────────────────────┐               │
│                   │ VIDEOCALLINTERFACE         │               │
│                   │ (React Component)          │               │
│                   │ - Receives token           │               │
│                   │ - Receives roomName        │               │
│                   │ - Uses LiveKit SDK         │               │
│                   └─────┬──────────────────────┘               │
│                         │                                       │
│                   ┌─────▼──────────────────────┐               │
│                   │   LIVEKIT CLIENT SDK       │               │
│                   │  (livekit-client)          │               │
│                   │  WebRTC Connection         │               │
│                   │  @livekit/components-react │               │
│                   └─────┬──────────────────────┘               │
│                         │                                       │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          │ WebSocket (secure)
                          │
        ┌─────────────────▼──────────────────┐
        │       LIVEKIT SERVER                │
        │  (External Service)                 │
        │                                     │
        │  - Room Management                  │
        │  - Participant Coordination          │
        │  - Media Routing                     │
        │  - Recording (optional)              │
        │                                     │
        └─────────────────────────────────────┘
```

## Data Flow

### 1. Teacher Starts Class

```
Teacher Dashboard
    │
    ├─ Click "Start Class" button
    │
    └─► POST /api/video/token
        ├─ Request: { classId, roomName }
        │
        ├─ Validate Supabase session
        ├─ Check user is teacher of this class
        ├─ Get teacher name from Teachers table
        │
        ├─ Generate JWT token using livekit-server-sdk
        │  ├─ identity: teacher_id
        │  ├─ name: teacher_name
        │  ├─ room: roomName
        │  ├─ canPublish: true
        │  ├─ canPublishData: true
        │  ├─ canSubscribe: true
        │  └─ ttl: 1800 (30 minutes)
        │
        └─ Response: { token, roomName, identity }
            │
            └─► Update state: setToken(), setRoomName()
                │
                └─► Render VideoCallInterface
                    │
                    ├─ Props: token, roomName, userName, userRole="teacher"
                    │
                    └─► LiveKitRoom component
                        ├─ serverUrl: NEXT_PUBLIC_LIVEKIT_URL
                        ├─ token: (received JWT)
                        ├─ Connects to LiveKit server
                        │
                        └─► Teacher joins room successfully
                            ├─ Video feed active
                            ├─ Audio feed active
                            └─ Waiting for learner
```

### 2. Learner Joins Class

```
Learner Dashboard
    │
    ├─ See active class from teacher
    ├─ Click "Join Class" button
    │
    └─► POST /api/video/token
        ├─ Request: { classId, roomName }
        │
        ├─ Validate Supabase session
        ├─ Check user is learner in this booking
        ├─ Get learner name from learners table
        │
        ├─ Generate JWT token using livekit-server-sdk
        │  ├─ identity: learner_id
        │  ├─ name: learner_name
        │  ├─ room: roomName
        │  ├─ canPublish: true
        │  ├─ canPublishData: true
        │  ├─ canSubscribe: true
        │  └─ ttl: 1800 (30 minutes)
        │
        └─ Response: { token, roomName, identity }
            │
            └─► Update state: setToken()
                │
                └─► Render VideoCallInterface
                    │
                    ├─ Props: token, roomName, userName, userRole="learner"
                    │
                    └─► LiveKitRoom component
                        ├─ serverUrl: NEXT_PUBLIC_LIVEKIT_URL
                        ├─ token: (received JWT)
                        ├─ Connects to LiveKit server
                        │
                        └─► Learner joins room
                            ├─ Video feed active
                            ├─ Audio feed active
                            ├─ Sees teacher's video
                            └─ Teacher sees learner's video
```

### 3. End Class

```
Teacher clicks "End Call"
    │
    └─► handleEndCall()
        ├─ POST /api/classes/end
        │  ├─ Update classes table: ended_at = now()
        │  └─ Disconnect from LiveKit room
        │
        └─► Close VideoCallInterface dialog
            │
            └─ LiveKit disconnects
               ├─ Learner gets disconnected
               ├─ Room stays but empty
               └─ Both return to dashboard
```

## Database Schema

### Classes Table
```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY,
  booking_id UUID,
  teacher_id UUID,
  student_id UUID,
  room_id TEXT,           -- ← Used as LiveKit room name
  status TEXT,
  
  -- Optional analytics columns (from migration.sql)
  provider TEXT,           -- 'livekit' or 'daily'
  started_at TIMESTAMP,   -- When session started
  ended_at TIMESTAMP,     -- When session ended
  duration_minutes INT    -- Total duration
);
```

### Other Tables (Unchanged)
- `bookings` - Booking information
- `Teachers` - Teacher profiles
- `learners` - Learner profiles
- `teacher_skills` - Teacher expertise
- All other existing tables

### Token Storage
**Important:** Tokens are NOT stored in database.
- Generated on-demand in `/api/video/token`
- Valid for 30 minutes only
- Discarded after use
- Never persisted

## Security Model

### Token Generation
```
Request comes with Supabase session
    │
    ├─ Validate session JWT is valid
    ├─ Extract user_id from session
    │
    ├─ Verify user belongs to class
    │  ├─ If teacher_id matches user_id → Grant teacher permissions
    │  └─ If student_id matches user_id → Grant learner permissions
    │
    ├─ Generate LiveKit JWT token
    │  ├─ Signed with LIVEKIT_API_SECRET (server-only)
    │  ├─ Claims include:
    │  │  ├─ identity: user_id
    │  │  ├─ room: room_name
    │  │  ├─ permissions: {...based on role}
    │  │  └─ exp: now + 1800 seconds
    │  │
    │  └─ No token stored in database
    │
    └─ Return token to frontend
        │
        └─ Token used once to connect to LiveKit
```

### Permissions Model

**Teacher Token Claims:**
```json
{
  "identity": "teacher-uuid-123",
  "name": "Teacher Name",
  "room": "class_abc123",
  "permissions": {
    "canPublish": true,
    "canPublishData": true,
    "canSubscribe": true,
    "canPublishSources": ["camera", "microphone", "screen_share"]
  },
  "exp": 1234567890
}
```

**Learner Token Claims:**
```json
{
  "identity": "learner-uuid-456",
  "name": "Learner Name",
  "room": "class_abc123",
  "permissions": {
    "canPublish": true,
    "canPublishData": true,
    "canSubscribe": true,
    "canPublishSources": ["camera", "microphone"]
  },
  "exp": 1234567890
}
```

## Component Hierarchy

```
App
├─ TeacherDashboard / LearnerDashboard
│  │
│  ├─ State: token, roomName, isVideoCallOpen
│  │
│  └─ VideoCallInterface (conditional render)
│     │
│     ├─ Dialog (UI wrapper)
│     │
│     ├─ Card (header + content)
│     │
│     ├─ LiveKitRoom (connects to server)
│     │  │
│     │  └─ VideoConference (pre-built UI)
│     │     │
│     │     ├─ GridLayout (participant tiles)
│     │     │  │
│     │     │  ├─ ParticipantTile (teacher)
│     │     │  │  ├─ Video
│     │     │  │  ├─ Audio
│     │     │  │  └─ Name label
│     │     │  │
│     │     │  └─ ParticipantTile (learner)
│     │     │     ├─ Video
│     │     │     ├─ Audio
│     │     │     └─ Name label
│     │     │
│     │     └─ Controls (mute, camera, etc.)
│     │
│     ├─ Loading state (while connecting)
│     └─ Error state (if connection fails)
```

## API Routes

### POST /api/video/token
**Generates JWT access token for LiveKit room**

Request:
```json
{
  "classId": "class-uuid-123",
  "roomName": "class_abc123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roomName": "class_abc123",
  "identity": "user-uuid-456"
}
```

Errors:
- 401: Unauthorized (no session)
- 403: Forbidden (not member of class)
- 404: Class not found
- 500: Token generation failed

### POST /api/classes/end
**Records class end time and updates status**

Request:
```json
{
  "classId": "class-uuid-123"
}
```

Response:
```json
{
  "success": true,
  "classId": "class-uuid-123"
}
```

## Environment Variables

### Required
```
LIVEKIT_URL=wss://your-livekit-server.example.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret (server-only, never expose)
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.example.com
```

### Optional (if still using Daily.co in parallel)
```
DAILY_API_KEY=... (remove after migration)
DAILY_DOMAIN=... (remove after migration)
```

## Performance Considerations

### Token Generation
- Time: < 100ms per token
- No database writes
- Minimal CPU usage
- Scales to thousands of tokens per minute

### Room Management
- Rooms auto-created on first join
- Cleaned up automatically when empty
- No manual cleanup needed
- Supports concurrent classes

### WebRTC Connection
- Automatic quality adaptation
- Peer-to-peer when possible
- Falls back to TURN for firewalls
- Typical latency: < 100ms

## Error Handling

### Frontend Errors
- Missing token → Show error message
- Invalid room name → Show error message
- Connection failed → Retry with exponential backoff
- Token expired → Auto-disconnect and refresh
- Network issues → Graceful fallback

### Backend Errors
- Invalid session → Return 401
- User not in class → Return 403
- Token generation fails → Return 500
- Supabase query fails → Return 500
- All errors logged to console

### User Experience
- Loading spinner while connecting
- Clear error messages
- Automatic retry on transient failures
- Graceful disconnection
- Session end notification

## Monitoring & Logging

### Frontend Logging
```typescript
console.log("[v0] Token request for classId:", classId)
console.log("[v0] VideoCallInterface mounted")
console.log("[v0] Successfully connected to LiveKit room:", roomName)
```

### Backend Logging
```typescript
console.log("[v0] Token request for classId:", classId, "userId:", user.id)
console.error("[v0] User unauthorized for this class:", user.id)
console.log("[v0] Generated token for user:", user.id, "room:", roomName)
```

### LiveKit Dashboard
- Real-time room metrics
- Participant connection status
- Bandwidth usage
- Error rates
- Recording status

## Scaling Considerations

### Current Capacity
- 2 participants per room (teacher + learner)
- 30-minute session limit (configurable)
- Unlimited concurrent rooms
- Thousands of rooms per instance

### Future Scaling
- Add room size limit to schema
- Implement room capacity checks
- Add queue system for waitlist
- Scale LiveKit to multiple instances
- Add CDN for signaling servers

## Backward Compatibility

### During Migration
- Keep both Daily.co and LiveKit endpoints running
- Use feature flags to switch implementations
- Gradual rollout to users
- Maintain rollback capability

### After Migration
- Remove Daily.co code completely
- Remove Daily.co environment variables
- Remove Daily.co dependencies from package.json
- Keep documentation for reference

---

**Diagram Version:** 1.0  
**Last Updated:** 2024  
**Status:** Ready for implementation
