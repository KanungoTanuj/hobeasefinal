# LiveKit Migration - Quick Reference Guide

## 🚀 TL;DR (Too Long; Didn't Read)

### In 60 Seconds
1. Install packages: `npm install livekit-client @livekit/components-react livekit-server-sdk`
2. Set 4 environment variables in Vercel
3. Create `/api/video/token` endpoint (provided code)
4. Replace VideoCallInterface component (provided code)
5. Update 2 dashboard join buttons (find-replace in code)
6. Test and deploy

### Estimated Time: 4 hours

---

## 📦 Three Files to Create/Replace

### 1. Token Endpoint (NEW)
**File:** `app/api/video/token/route.ts`  
**Action:** Create new file  
**Code:** See IMPLEMENTATION_GUIDE.md → "Secure Token Endpoint"  
**Time:** 15 min

### 2. Video Component (REPLACE)
**File:** `components/video-call-interface.tsx`  
**Action:** Backup old, replace with new  
**Code:** See IMPLEMENTATION_GUIDE.md → "VideoCallInterface Component"  
**Time:** 20 min

### 3. Update Dashboards (EDIT)
**Files:**
- `app/teacher/dashboard/page.tsx`
- `app/learner/dashboard/page.tsx`

**Change:** Replace Daily.co API calls with LiveKit token endpoint  
**Time:** 1 hour

---

## 🔑 Environment Variables (Must Have)

```bash
# Add to Vercel (Settings → Environment Variables)
LIVEKIT_URL=wss://your-livekit-server.example.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.example.com
```

---

## 📝 Code Changes Summary

### Token Endpoint Changes
```typescript
// OLD ENDPOINT (delete this)
POST /api/video/create-room
├─ Calls Daily.co API
├─ Returns room URL
└─ Stores Daily domain

// NEW ENDPOINT (create this)
POST /api/video/token
├─ Validates session
├─ Checks class membership
├─ Generates JWT token
└─ Returns token + room name
```

### Dashboard Changes
```typescript
// OLD CODE (in dashboards)
const response = await fetch("/api/video/create-room", {
  method: "POST",
  body: JSON.stringify({ roomId, userName })
})
const { url } = await response.json()

// NEW CODE (in dashboards)
const response = await fetch("/api/video/token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ classId, roomName })
})
const { token } = await response.json()
```

### Component Props Changes
```typescript
// OLD PROPS
<VideoCallInterface
  roomId={roomId}
  userName={userName}
/>

// NEW PROPS
<VideoCallInterface
  token={token}
  roomName={roomName}
  classId={classId}
  userName={userName}
  userRole="teacher"
  onEndCall={handleEndCall}
  isOpen={isVideoCallOpen}
  onClose={() => setIsVideoCallOpen(false)}
/>
```

---

## 🧪 Quick Test

```bash
# 1. Start dev server
npm run dev

# 2. Test token endpoint
curl -X POST http://localhost:3000/api/video/token \
  -H "Content-Type: application/json" \
  -d '{"classId":"test","roomName":"test-room"}'

# Expected: {"token":"eyJ...","roomName":"test-room"}
```

---

## 📚 Documentation Map

| Need | File | Section |
|------|------|---------|
| Overview | LIVEKIT_README.md | - |
| Architecture | ARCHITECTURE.md | System Overview |
| Code details | IMPLEMENTATION_GUIDE.md | Implementation Steps |
| Step-by-step | MIGRATION_CHECKLIST.md | Phase 1-8 |
| API spec | IMPLEMENTATION_GUIDE.md | Token Endpoint |
| Component spec | IMPLEMENTATION_GUIDE.md | VideoCallInterface |
| SQL migration | scripts/livekit-migration.sql | Optional |

---

## ⚠️ Common Gotchas

### Gotcha 1: Token Never Stored
**Problem:** "Where are tokens stored?"  
**Answer:** Nowhere. Generated on-demand, expire after 30 min.

### Gotcha 2: Room Names Must Match
**Problem:** "Token says room 'A' but component uses room 'B'"  
**Answer:** Token roomName and component roomName MUST match.

### Gotcha 3: Env Vars Case-Sensitive
**Problem:** "livek it_url not working"  
**Answer:** Must be `NEXT_PUBLIC_LIVEKIT_URL` (exact case).

### Gotcha 4: Permissions Denied
**Problem:** "User can't join their own room"  
**Answer:** Check that user_id matches teacher_id or student_id in classes table.

### Gotcha 5: Component Import
**Problem:** "@livekit/components-react not found"  
**Answer:** Did you `npm install`? Restart dev server after install.

---

## 🔄 Database Changes

### Required: NONE ✅
System works with existing schema.

### Optional: Add Analytics Columns
```sql
ALTER TABLE classes
ADD COLUMN provider TEXT DEFAULT 'livekit',
ADD COLUMN started_at TIMESTAMP,
ADD COLUMN ended_at TIMESTAMP,
ADD COLUMN duration_minutes INT;
```

See `scripts/livekit-migration.sql` for full SQL.

---

## 🎯 Success Indicators

When migration is done, you should have:

✅ Token endpoint at `/api/video/token`  
✅ New VideoCallInterface component  
✅ Teachers can start classes  
✅ Learners can join classes  
✅ Two-way audio/video works  
✅ End call button works  
✅ No Daily.co code remaining  
✅ All tests passing  

---

## 🚨 Troubleshooting

### "Cannot find module 'livekit-client'"
```bash
npm install livekit-client @livekit/components-react livekit-server-sdk
npm run dev
```

### "Token generation fails"
- Check `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are set
- Verify they're correct values from LiveKit dashboard
- Check `.env.local` or Vercel env vars

### "Cannot connect to room"
- Check `NEXT_PUBLIC_LIVEKIT_URL` is set
- Check WebSocket URL is correct format: `wss://...`
- Test connection: `telnet your-livekit-server 443`

### "Audio/video not working"
- Check camera/microphone permissions in browser
- Verify both users in same room
- Check browser console for errors

---

## 📋 Pre-Flight Checklist

Before you start:

- [ ] LiveKit account created
- [ ] API Key and Secret obtained
- [ ] WebSocket URL copied
- [ ] Node.js 18+ installed
- [ ] `npm install` completed
- [ ] Environment variables set
- [ ] Read LIVEKIT_README.md
- [ ] Reviewed IMPLEMENTATION_GUIDE.md
- [ ] Git branch created: `git checkout -b livekit-migration`

---

## ⏱️ Time Budget

| Task | Time |
|------|------|
| Setup (install, env vars) | 15 min |
| Token endpoint | 15 min |
| VideoCallInterface | 20 min |
| Teacher dashboard | 30 min |
| Learner dashboard | 30 min |
| Testing | 60 min |
| Deployment | 15 min |
| Cleanup | 15 min |
| **Total** | **3.5 hours** |

---

## 🔗 Key Files Reference

### Read These First
1. LIVEKIT_README.md
2. ARCHITECTURE.md (diagrams)
3. IMPLEMENTATION_GUIDE.md

### Use These for Coding
1. app/api/video/token/route.ts (code)
2. components/video-call-interface-livekit.tsx (code)
3. MIGRATION_CHECKLIST.md (execution)

### Reference As Needed
1. LIVEKIT_MIGRATION.md (architecture)
2. QUICK_REFERENCE.md (this file)
3. LIVEKIT_FILES_SUMMARY.md (file descriptions)

---

## 🎓 Learning Resources

### Official LiveKit Docs
- **Docs:** https://docs.livekit.io
- **Client SDK:** https://docs.livekit.io/client-sdk-js/
- **Server SDK:** https://docs.livekit.io/server-sdk-js/
- **Components:** https://docs.livekit.io/components/

### Repository
- **GitHub:** https://github.com/livekit/livekit-web
- **Components:** https://github.com/livekit/components-js
- **Examples:** https://github.com/livekit/livekit-js-examples

---

## 🎯 Next Steps

### Right Now
1. Read LIVEKIT_README.md (10 min)
2. Check you have LiveKit credentials

### Today
1. Install packages
2. Set environment variables
3. Create token endpoint
4. Test token endpoint

### Tomorrow
1. Replace VideoCallInterface
2. Update dashboards
3. Run integration tests
4. Deploy to production

---

## 📞 Need Help?

### Check These First
- QUICK_REFERENCE.md → Troubleshooting section (this file)
- MIGRATION_CHECKLIST.md → Troubleshooting section
- LIVEKIT_README.md → Troubleshooting section

### Then Check
- LiveKit docs: https://docs.livekit.io
- GitHub issues: https://github.com/livekit/livekit-web/issues
- LiveKit community: https://livekit.io/community

---

## ✨ Pro Tips

1. **Test locally first** - Don't jump straight to production
2. **Keep Daily.co backup** - Useful for quick rollback if needed
3. **Monitor LiveKit dashboard** - Watch real-time metrics during testing
4. **Test in incognito** - Prevents browser caching issues
5. **Check env vars twice** - Most issues are env var related
6. **Read error logs** - Vercel logs and browser console have good hints
7. **Ask for help** - LiveKit team is responsive on GitHub

---

## 📌 Remember

- **Tokens are temporary** - They expire after 30 minutes
- **No database tokens** - Tokens are generated on-demand
- **Room names are simple** - Just use `classes.room_id`
- **Permissions are automatic** - JWT includes role-based permissions
- **Testing is critical** - Don't skip the test phase
- **Monitoring is important** - Watch logs after deployment

---

**You're ready! Start with LIVEKIT_README.md →**

Good luck! 🚀
