# LiveKit Implementation Guide

## 1. Token Generation Endpoint

**File:** `app/api/video/token/route.ts`

This endpoint generates JWT tokens for LiveKit room access. It validates the user's access and assigns appropriate permissions based on their role.

**Key Features:**
- Validates Supabase session
- Verifies user belongs to the class
- Assigns permissions based on teacher/learner role
- Generates 30-minute expiring tokens
- Returns room name and token

**Request:**
```json
{
  "classId": "class-uuid",
  "roomName": "class_abc123"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "roomName": "class_abc123"
}
```

**Teacher Permissions:**
- `publish_video` - Can send video
- `publish_audio` - Can send audio
- `publish_data` - For chat/commands
- `can_publish_data_message` - Extra data publication
- `can_subscribe` - Can receive streams

**Learner Permissions:**
- `publish_video` - Can send video
- `publish_audio` - Can send audio
- `publish_data` - For chat/commands
- `can_subscribe` - Can receive streams

## 2. VideoCallInterface Component

**File:** `components/video-call-interface.tsx`

The refactored component now uses LiveKit SDK instead of Daily.co.

**Props:**
```typescript
interface VideoCallInterfaceProps {
  token: string
  roomName: string
  classId: string
  userName: string
  userRole: "teacher" | "learner"
  onEndCall: () => void
  isOpen: boolean
  onClose: () => void
}
```

**Key Changes from Daily.co:**
- No more iframe (uses LiveKit components)
- Token-based auth (no URL embedding)
- Real React components for participants
- Native screen sharing support
- WebRTC-based (better quality/lower latency)

**Features:**
- Live participant grid
- Screen share view
- Participant info (name, connection quality)
- Control buttons (mute, end call, etc.)
- Teacher can mute/remove learners
- Loading state with skeleton
- Error handling

## 3. Dashboard Integration (Teacher)

**File:** `app/teacher/dashboard/page.tsx`

**Changes in handleStartClass:**

```typescript
// Old flow
const response = await fetch("/api/video/create-room", {
  method: "POST",
  body: JSON.stringify({ roomId, userName })
})
const { url } = await response.json()
setDailyRoomUrl(url)

// New flow
const response = await fetch("/api/video/token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ 
    classId, 
    roomName: roomId 
  })
})
const { token } = await response.json()
setToken(token)
setRoomName(roomId)
```

**Changes in component props:**
```tsx
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

## 4. Dashboard Integration (Learner)

**File:** `app/learner/dashboard/page.tsx`

**Changes in handleJoinClass:**

```typescript
// Old flow
const response = await fetch("/api/video/create-room", {
  method: "POST",
  body: JSON.stringify({ roomId, userName })
})
const { url } = await response.json()
setDailyRoomUrl(url)

// New flow
const response = await fetch("/api/video/token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ 
    classId: activeClassId, 
    roomName: activeRoomId 
  })
})
const { token } = await response.json()
setToken(token)
```

**Changes in component props:**
```tsx
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

## 5. API Route for Class End

**File:** `app/api/classes/end/route.ts`

This endpoint can optionally record room end time and duration:

```typescript
// Optional: Update classes table with end time and duration
if (classId) {
  await supabase
    .from("classes")
    .update({
      ended_at: new Date().toISOString(),
      duration_minutes: Math.floor((Date.now() - sessionStartTime) / 60000)
    })
    .eq("id", classId)
}
```

## State Management Changes

### Teacher Dashboard
```typescript
// Add these states
const [token, setToken] = useState<string>("")
const [roomName, setRoomName] = useState<string>("")

// Remove if not needed
// const [dailyRoomUrl, setDailyRoomUrl] = useState<string>("")
```

### Learner Dashboard
```typescript
// Add these states
const [token, setToken] = useState<string>("")
// roomName already exists as activeRoomId

// Remove if not needed
// const [dailyRoomUrl, setDailyRoomUrl] = useState<string>("")
```

## Error Handling

Token endpoint should handle:
- Missing Supabase session → 401
- User doesn't belong to class → 403
- Invalid class ID → 400
- LiveKit token generation fails → 500

Component should handle:
- Missing token → Show error message
- Connection fails → Retry or show "Unable to connect"
- Participant join fails → Show error
- Token expires → Auto-disconnect with message

## Token Expiry Strategy

**Current:** 30 minutes (1800 seconds)

**Options:**
- Class duration ≤ 30 min: No changes needed
- Class duration > 30 min: Implement token refresh in component
  ```typescript
  // Refresh token 5 minutes before expiry
  useEffect(() => {
    const refreshTimer = setInterval(async () => {
      const newToken = await fetch("/api/video/token", {...})
      // Update token in LiveKit participant
    }, 25 * 60 * 1000) // 25 minutes
  }, [])
  ```

## Security Considerations

1. **Token generation** is server-only (never expose API secret)
2. **Tokens expire** automatically (30 min default)
3. **User validation** checks class ownership
4. **Role-based permissions** in JWT claims
5. **No token storage** keeps database clean

## Monitoring & Analytics

Optional additions:

1. **Log room metrics:**
   ```typescript
   // In token endpoint
   console.log(`[v0] Room created: ${roomName}, User: ${userId}, Role: ${userRole}`)
   ```

2. **Track session duration:**
   ```typescript
   // In class end handler
   const duration = (endTime - startTime) / 60000
   console.log(`[v0] Session duration: ${duration} minutes`)
   ```

3. **LiveKit Dashboard:**
   - View real-time room metrics
   - Monitor participant connections
   - Check bandwidth usage
   - Review error rates

## Testing Checklist

- [ ] Install packages successfully
- [ ] Environment variables set
- [ ] Token endpoint generates valid JWT
- [ ] Teacher can start class
- [ ] Learner can join with token
- [ ] Audio/video streams work
- [ ] Screen sharing works
- [ ] Token expires at 30 min
- [ ] Error handling works
- [ ] Multiple concurrent classes work
- [ ] End call properly closes room
