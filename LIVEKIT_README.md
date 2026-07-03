# LiveKit Migration for Hobease

This directory contains all materials needed to migrate Hobease from Daily.co to LiveKit for video conferencing.

## 📋 Quick Start

1. **Read:** `LIVEKIT_MIGRATION.md` - Overview and architecture
2. **Implement:** `IMPLEMENTATION_GUIDE.md` - Detailed code changes
3. **Execute:** `MIGRATION_CHECKLIST.md` - Step-by-step checklist
4. **Scripts:** `scripts/livekit-migration.sql` - Optional database updates

## 📁 Files Included

### Documentation
- **LIVEKIT_MIGRATION.md** - High-level overview and architecture
- **IMPLEMENTATION_GUIDE.md** - Detailed implementation instructions
- **MIGRATION_CHECKLIST.md** - Complete step-by-step checklist
- **LIVEKIT_README.md** - This file

### Code Files (Ready to Use)
- **app/api/video/token/route.ts** - Token generation endpoint
- **components/video-call-interface-livekit.tsx** - New LiveKit component
- **scripts/livekit-migration.sql** - Optional schema changes

### Database
- **scripts/livekit-migration.sql** - Optional analytics columns

## 🚀 At a Glance

### Current Architecture (Daily.co)
```
User clicks "Join" 
→ Daily.co room URL created
→ Embedded iframe loads
→ Daily UI handles everything
```

### New Architecture (LiveKit)
```
User clicks "Join"
→ Backend generates JWT token
→ React component connects with token
→ Custom UI with React components
→ Better control and security
```

## 🔑 Key Points

1. **No Database Schema Changes Required**
   - Reuse existing `classes.room_id` as LiveKit room name
   - Tokens generated on-demand, never stored
   - Optional: Add analytics columns (started_at, ended_at, duration_minutes)

2. **Token Strategy**
   - Generated server-side only
   - Expire after 30 minutes
   - Include role-based permissions
   - Never exposed to client

3. **User Roles**
   - **Teacher:** Can publish video/audio, mute others, share screen, end class
   - **Learner:** Can publish video/audio, receive streams

4. **Minimal Code Changes**
   - Replace `/api/video/create-room` with `/api/video/token`
   - Update VideoCallInterface component
   - Update dashboard join logic (3 locations)
   - No changes to booking system, auth, or messaging

## 📊 Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `app/api/video/token/route.ts` | Create new endpoint | HIGH |
| `components/video-call-interface.tsx` | Replace component | HIGH |
| `app/teacher/dashboard/page.tsx` | Update join flow | HIGH |
| `app/learner/dashboard/page.tsx` | Update join flow | HIGH |
| `package.json` | Add dependencies | HIGH |
| `.env.local` | Add LiveKit env vars | HIGH |
| `scripts/livekit-migration.sql` | Run optional migrations | LOW |

## ⏱️ Estimated Timeline

| Phase | Time | Task |
|-------|------|------|
| 1. Setup | 30 min | Install, env vars, SQL |
| 2. Token Endpoint | 30 min | Create API route |
| 3. Component | 1 hour | Replace VideoCallInterface |
| 4. Teacher Dashboard | 1 hour | Update join logic |
| 5. Learner Dashboard | 1 hour | Update join logic |
| 6. Testing | 1 hour | Integration tests |
| 7. Cleanup | 30 min | Remove Daily.co code |
| 8. Deploy | 30 min | Push to production |
| **Total** | **~6 hours** | Full migration |

## ✅ Prerequisites

- [ ] LiveKit account with API Key and Secret
- [ ] LiveKit WebSocket URL (e.g., `wss://livekit-server.example.com`)
- [ ] Access to Vercel project for env vars
- [ ] Access to Supabase (for optional SQL migrations)
- [ ] Node.js 18+ and npm installed
- [ ] GitHub access for pushing changes

## 🔧 Environment Variables Needed

```
LIVEKIT_URL=wss://your-livekit-server.example.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.example.com
```

Set these in:
1. Vercel Dashboard (Settings → Environment Variables)
2. Local `.env.local` for development

## 📚 Documentation

### Full Guide
Start here for complete understanding:
```bash
# 1. Read architecture overview
cat LIVEKIT_MIGRATION.md

# 2. Read implementation details
cat IMPLEMENTATION_GUIDE.md

# 3. Follow the checklist
cat MIGRATION_CHECKLIST.md
```

### Code References
- **Token Endpoint:** `app/api/video/token/route.ts`
- **Component:** `components/video-call-interface-livekit.tsx`
- **Database Script:** `scripts/livekit-migration.sql`

### External Links
- [LiveKit Documentation](https://docs.livekit.io)
- [LiveKit Cloud Console](https://cloud.livekit.com)
- [@livekit/components-react](https://github.com/livekit/components-js)

## 🧪 Testing

### Quick Test
```bash
# 1. Start dev server
npm run dev

# 2. Login as teacher
# 3. Navigate to dashboard
# 4. Click "Start Class"
# 5. Should see connection loading
# 6. Open new incognito window
# 7. Login as learner
# 8. Join same class
# 9. Both should see video/audio
```

### Advanced Testing
See `MIGRATION_CHECKLIST.md` Phase 6 for detailed test scenarios:
- Teacher starts, learner joins
- Audio/video controls
- Call end
- Token expiry
- Error handling
- Concurrent classes

## 🐛 Troubleshooting

### "Cannot find module 'livekit-client'"
```bash
npm install livekit-client @livekit/components-react livekit-server-sdk
npm run dev
```

### "Token generation fails"
- Check env vars are set in Vercel
- Verify API Key and Secret are correct
- Check function logs in Vercel

### "Cannot connect to room"
- Verify NEXT_PUBLIC_LIVEKIT_URL is correct
- Check LiveKit server is running
- Verify firewall allows WebSocket connections

### "Audio/video not working"
- Check browser camera/microphone permissions
- Verify both users are in same room
- Check browser console for errors

See `MIGRATION_CHECKLIST.md` for more troubleshooting.

## 📋 Migration Steps Overview

### Phase 1: Setup (30 min)
- Install LiveKit packages
- Set environment variables
- Optional: Run SQL migration

### Phase 2: Create Token Endpoint (30 min)
- Create `/api/video/token/route.ts`
- Test endpoint with curl/Postman
- Verify token generation

### Phase 3: Update Component (1 hour)
- Backup old component
- Deploy new LiveKit component
- Verify props and functionality

### Phase 4 & 5: Update Dashboards (2 hours)
- Update teacher dashboard
- Update learner dashboard
- Test both flows

### Phase 6: Integration Testing (1 hour)
- Test teacher → learner connection
- Test controls and features
- Test error scenarios

### Phase 7: Cleanup (30 min)
- Remove Daily.co code
- Remove Daily.co env vars
- Update documentation

### Phase 8: Deploy (30 min)
- Build and verify
- Deploy to production
- Monitor for errors

## 🎯 Success Criteria

After migration, you should have:
- ✅ Teachers can start classes
- ✅ Learners can join classes
- ✅ Two-way audio/video works
- ✅ Can see other participants
- ✅ Can end class properly
- ✅ Tokens expire correctly
- ✅ Error handling works
- ✅ Multiple concurrent classes work
- ✅ No Daily.co references in code
- ✅ Production deployment stable

## 📞 Support & Resources

| Resource | Link |
|----------|------|
| LiveKit Docs | https://docs.livekit.io |
| LiveKit Community | https://livekit.io/community |
| GitHub Issues | https://github.com/livekit/livekit-web |
| API Reference | https://docs.livekit.io/api |

## 📝 Notes

- **Token TTL:** Set to 30 minutes (1800 seconds). Adjust in `app/api/video/token/route.ts` if needed.
- **Room Names:** Use `classes.room_id` as LiveKit room name
- **Permissions:** Teachers and learners get different permission sets
- **Screen Share:** Enabled for teachers, received by learners
- **Recordings:** Not enabled by default. See LiveKit docs for egress setup.

## 🔄 Rollback

If critical issues occur:
1. Revert to Daily.co component backup
2. Revert environment variables
3. Deploy previous version
4. Investigate issue
5. Try again or contact support

Full rollback instructions in `MIGRATION_CHECKLIST.md`.

---

**Last Updated:** 2024
**Status:** Ready for migration
**Version:** 1.0
