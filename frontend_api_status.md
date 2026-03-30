# Frontend API Status — Successfully Integrated APIs

This file tracks only the APIs that are fully integrated and working in the frontend.

---

## Auth APIs — Fully Integrated

| API | Endpoint | Frontend Hook | Integrated In |
|-----|----------|--------------|---------------|
| Login | `POST /auth/login` | `useLoginMutation` | `lib/api/endpoints/auth.ts` |
| Register | `POST /auth/register` | `useRegisterMutation` | `lib/api/endpoints/auth.ts` |
| Verify Email | `POST /auth/verify-email` | `useVerifyEmailMutation` | `lib/api/endpoints/auth.ts` |
| Resend OTP | `POST /auth/resend-otp` | `useResendOtpMutation` | `lib/api/endpoints/auth.ts` |
| Forgot Password | `POST /auth/forgot-password` | `useForgotPasswordMutation` | `lib/api/endpoints/auth.ts` |
| Reset Password | `POST /auth/reset-password` | `useResetPasswordMutation` | `lib/api/endpoints/auth.ts` |

---

## Book APIs — Fully Integrated

| API | Endpoint | Frontend Hook | Used In |
|-----|----------|--------------|---------|
| Create Book | `POST /books` | `useCreateBookMutation` | `LibraryPage.tsx` — create book form |
| List My Books | `GET /books/me` | `useMyBooksQuery` | `LibraryPage.tsx` — book grid |
| List Public Books | `GET /books/public` | `usePublicBooksQuery` | `lib/api/endpoints/books.ts` (ready) |
| Get Book Detail | `GET /books/{id}` | `useBookDetailQuery` | `BookSlokas.tsx`, `SlokaDetail.tsx` |
| Update Book | `PATCH /books/{id}` | `useUpdateBookMutation` | `BookSlokas.tsx` — visibility selector |
| Delete Book | `DELETE /books/{id}` | `useDeleteBookMutation` | `lib/api/endpoints/books.ts` (ready) |
| Upload Book Cover | `POST /books/{id}/cover` | `useUploadBookCoverMutation` | `lib/api/endpoints/books.ts` (ready) |

---

## Shlok APIs — Fully Integrated

| API | Endpoint | Frontend Hook | Used In |
|-----|----------|--------------|---------|
| Create Shlok | `POST /shloks` | `useCreateShlokMutation` | `BookSlokas.tsx` — create shlok modal |
| List Shloks by Book | `GET /shloks/book/{id}` | `useShloksByBookQuery` | `BookSlokas.tsx` — shlok list |
| Get Shlok Detail | `GET /shloks/{id}` | `useShlokDetailQuery` | `SlokaDetail.tsx` — shlok header |
| Update Shlok | `PATCH /shloks/{id}` | `useUpdateShlokMutation` | `SlokaDetail.tsx` — edit sloka modal + visibility |
| Delete Shlok | `DELETE /shloks/{id}` | `useDeleteShlokMutation` | `lib/api/endpoints/shloks.ts` (ready) |
| Upload Shlok Audio | `POST /shloks/{id}/audio` | `useUploadShlokAudioMutation` | `lib/api/endpoints/shloks.ts` (ready) |
| Get Related Shloks | `GET /shloks/{id}/related` | `useShlokRelatedQuery` | `lib/api/endpoints/shloks.ts` (ready) |
| Add Cross Reference | `POST /shloks/{id}/cross-references` | `useAddCrossReferenceMutation` | `lib/api/endpoints/shloks.ts` (ready) |
| Get Cross References | `GET /shloks/{id}/cross-references` | `useShlokCrossReferencesQuery` | `lib/api/endpoints/shloks.ts` (ready) |

---

## Meanings APIs — Fully Integrated (New Feature)

Backend module built from scratch this session (`shloks-backend/src/modules/meanings/`).

| API | Endpoint | Frontend Hook | Used In |
|-----|----------|--------------|---------|
| Get Meanings Tree | `GET /shloks/{id}/meanings` | `useMeaningsQuery` | `SlokaDetail.tsx` — meanings tree |
| Create Meaning | `POST /shloks/{id}/meanings` | `useCreateMeaningMutation` | `SlokaDetail.tsx` — AddMeaningModal |
| Update Meaning | `PATCH /meanings/{id}` | `useUpdateMeaningMutation` | `SlokaDetail.tsx` — edit meaning modal |
| Delete Meaning | `DELETE /meanings/{id}` | `useDeleteMeaningMutation` | `lib/api/endpoints/meanings.ts` (ready) |
| Vote on Meaning | `POST /meanings/{id}/vote` | `useVoteMeaningMutation` | `lib/api/endpoints/meanings.ts` (ready) |

---

## Route Guards — Implemented

| Component | Path | Behaviour |
|-----------|------|-----------|
| `PrivateRoute` | All `/dashboard/*` routes | Redirects to `/login` if no token |
| `PublicRoute` | `/login`, `/register`, `/verify-otp`, `/forgot-password`, `/reset-password` | Redirects to `/dashboard` if already logged in |

---

## Supporting Infrastructure Created

| File | Purpose |
|------|---------|
| `lib/api/queryKeys.ts` | Centralized QUERY_KEYS constants (includes meanings, friends, chat, discover, links, content-requests keys) |
| `types/index.ts` | All request/response types including friends, chat, links, content requests, discover |
| `lib/api/endpoints/meanings.ts` | All meanings API hooks |
| `lib/api/endpoints/friends.ts` | All friends / user-search API hooks |
| `lib/api/endpoints/discover.ts` | Discover books/shloks API hooks |
| `components/auth/PrivateRoute.tsx` | JWT-based private route guard |
| `components/auth/PublicRoute.tsx` | Public route guard |

---

## Friends APIs — Fully Integrated

| API | Endpoint | Frontend Hook | Used In |
|-----|----------|--------------|---------|
| Search Users | `GET /users/search?q=` | `useUserSearchQuery` | `FriendsPage.tsx` — Find People tab |
| Send Friend Request | `POST /friends/request` | `useSendFriendRequestMutation` | `FriendsPage.tsx` — Find People tab |
| List Incoming Requests | `GET /friends/requests/incoming` | `useIncomingRequestsQuery` | `FriendsPage.tsx` — Requests tab |
| List Outgoing Requests | `GET /friends/requests/outgoing` | `useOutgoingRequestsQuery` | `FriendsPage.tsx` — Sent tab |
| Accept Request | `PATCH /friends/requests/{id}/accept` | `useAcceptRequestMutation` | `FriendsPage.tsx` — Requests tab |
| Reject Request | `PATCH /friends/requests/{id}/reject` | `useRejectRequestMutation` | `FriendsPage.tsx` — Requests tab |
| Cancel Request | `DELETE /friends/requests/{id}` | `useCancelRequestMutation` | `FriendsPage.tsx` — Sent tab |
| List Friends | `GET /friends` | `useFriendsListQuery` | `FriendsPage.tsx` — Friends tab |
| Unfriend | `DELETE /friends/{id}` | `useUnfriendMutation` | `FriendsPage.tsx` — Friends tab |

---

## Chat APIs — Fully Integrated (Session 3)

| API | Endpoint | Frontend Hook | Used In |
|-----|----------|--------------|---------|
| List Conversations | `GET /chat/conversations` | `useConversationsQuery` | `MessagesPage.tsx` — left panel contact list |
| Get Messages | `GET /chat/messages/{partner_id}` | `useMessagesQuery` | `MessagesPage.tsx` — chat thread |
| Send Message | `POST /chat/messages/{partner_id}` | `useSendMessageMutation` | `MessagesPage.tsx` — input footer |
| Mark Seen | `POST /chat/messages/{partner_id}/seen` | `useMarkSeenMutation` | `MessagesPage.tsx` — auto on open |
| WebSocket | `WS /chat/ws?token=<jwt>` | `useChatSocket` | `MessagesPage.tsx` — real-time receive + typing |

---

## New Pages Added (Session 3)

| Page | Route | Description |
|------|-------|-------------|
| `MessagesPage.tsx` | `/dashboard/messages` | Two-panel P2P chat: contacts list + real-time chat thread |
| `MessagesPage.tsx` | `/dashboard/messages/:partnerId` | Direct link to specific conversation |

---

## Changes Made (Session 3)

| File | Change |
|------|--------|
| `src/components/ui/UserPicker.tsx` | Replaced static mockUsers with real `useFriendsListQuery` API data |
| `src/pages/FriendsPage.tsx` | Fixed field names (`.id` not `.friend_id`), added Chat button per friend, uses `sender_username` |
| `src/types/index.ts` | Fixed `FriendResponse` (id not friend_id), `MessageListResponse` (items not messages), `ConversationPreview` (friend_id/friend_username/friend_avatar), `FriendRequestResponse` (added sender_username, sender_avatar, receiver_username) |
| `src/lib/api/endpoints/chat.ts` | NEW — all chat API hooks + `useChatSocket` WebSocket hook |
| `src/components/dashboard/DashboardSidebar.tsx` | Chat expanded to submenu: AI Assistant + Messages |
| `app/schemas/chat.py` | Added `MessageBody` schema for send-message endpoint |
| `app/schemas/friends.py` | Added `receiver_username` to `FriendRequestResponse` |
| `app/services/friends.py` | `list_outgoing_requests` now populates `receiver_username` |
| `app/api/v1/routes/chat.py` | Added `POST /chat/messages/{partner_id}` send-message endpoint |

---

## Discover APIs — Fully Integrated

| API | Endpoint | Frontend Hook | Used In |
|-----|----------|--------------|---------|
| Discover Books | `GET /discover/books` | `useDiscoverBooksQuery` | `DiscoverPage.tsx` — now uses real API, replaces mockBooks |
| Discover Shloks | `GET /discover/shloks` | `useDiscoverShloksQuery` | `lib/api/endpoints/discover.ts` (ready) |

---

## New Backend Modules — Fully Built (Session 2)

All modules follow SOLID principles: route → service → repository → model pattern.

| Module | Backend Files | Status |
|--------|--------------|--------|
| Bug Fix: MissingGreenlet | `app/services/meanings.py` | Fixed `._children` ORM lazy load via `.__dict__.get("children", [])` |
| Friends / Social | `models/friend_request.py`, `repositories/friends.py`, `services/friends.py`, `routes/friends.py` | ✅ Done |
| Real-time Chat | `models/chat_message.py`, `core/ws_manager.py`, `repositories/chat.py`, `services/chat.py`, `routes/chat.py` | ✅ Done |
| Shareable Links | `models/shared_link.py`, `repositories/links.py`, `services/links.py`, `routes/links.py` | ✅ Done |
| Content Requests | `models/content_request.py`, `repositories/content_requests.py`, `services/content_requests.py`, `routes/content_requests.py` | ✅ Done |
| ABAC Permissions | `models/entity_permission.py`, `repositories/entity_permissions.py`, `services/entity_permissions.py`, `routes/entity_permissions.py` | ✅ Done |
| Discover | `routes/discover.py` | ✅ Done |

---

## Kirtan Library APIs — Fully Integrated (Session 4)

Backend built from scratch. Frontend fully integrated with audio playback and external link support.

| API | Endpoint | Frontend Hook | Used In |
|-----|----------|--------------|---------|
| List Tracks | `GET /kirtan/tracks` | `useKirtanTracksQuery` | `KirtanLibraryPage.tsx` — track list grid |
| Upload Audio | `POST /kirtan/tracks/{id}/audio` | `useUploadKirtanAudioMutation` | `KirtanLibraryPage.tsx` — audio upload button |

---

## Group Chat APIs — Fully Integrated (Current Session)

Backend built in prior session. Frontend Groups tab merged into MessagesPage.

| API | Endpoint | Frontend Hook | Used In |
|-----|----------|--------------|---------|
| List Groups | `GET /groups` | `useGroupsQuery` | `MessagesPage.tsx` — Groups tab left panel |
| Group Messages | `GET /groups/{id}/messages` | `useGroupMessagesQuery` | `MessagesPage.tsx` — GroupChatPanel |
| Create Group | `POST /groups` | `useCreateGroupMutation` | `MessagesPage.tsx` — CreateGroupModal |
| Leave Group | `DELETE /groups/{id}/leave` | `useLeaveGroupMutation` | `MessagesPage.tsx` — GroupChatPanel header |
| Send Group Message | `POST /groups/{id}/messages` | `useSendGroupMessageMutation` | `MessagesPage.tsx` — GroupChatPanel input |
| Delete Group Message | `DELETE /groups/{id}/messages/{msgId}` | `useDeleteGroupMessageMutation` | `MessagesPage.tsx` — message bubble |
| Edit Group Message | `PATCH /groups/{id}/messages/{msgId}` | `useEditGroupMessageMutation` | `MessagesPage.tsx` — message bubble |

---

## Entity Permissions — Shlok Cascade (Current Session)

| API | Endpoint | Frontend Hook | Used In |
|-----|----------|--------------|---------|
| Grant Shlok Permission | `POST /permissions/shlok/{id}` | `useSetEntityPermissionMutation("shlok")` | `SlokaDetail.tsx` — VisibilitySelector Done |
| Revoke Shlok Permission | `DELETE /permissions/shlok/{id}/{userId}` | `useRevokeEntityPermissionMutation("shlok")` | `SlokaDetail.tsx` — VisibilitySelector Done |
| Grant Book Permission (cascade) | `POST /permissions/book/{id}` | `useSetEntityPermissionMutation("book")` | `SlokaDetail.tsx` — auto-shares parent book |
| List Shlok Permissions | `GET /permissions/shlok/{id}` | `useEntityPermissionsQuery("shlok")` | `SlokaDetail.tsx` — loads existing shared users |

---

## WebRTC Call Signaling — Backend Relay (Current Session)

Call signal relay added to the existing WS endpoint at `ws://host/ws/chat`.  
No separate REST endpoint — signals are relayed peer-to-peer via the WebSocket manager.

| Event Type | Direction | Used In |
|------------|-----------|---------|
| `call_offer` | Caller → Callee | `MessagesPage.tsx` — `initiateCall()` |
| `call_answer` | Callee → Caller | `MessagesPage.tsx` — `answerCall()` |
| `call_reject` | Callee → Caller | `MessagesPage.tsx` — `rejectCall()` |
| `call_ice_candidate` | Both directions | `MessagesPage.tsx` — ICE negotiation |
| `call_end` | Either party | `MessagesPage.tsx` — `hangUp()` |
| Create Track | `POST /kirtan/tracks` | `useCreateKirtanTrackMutation` | `KirtanLibraryPage.tsx` — AddSongModal |
| Toggle Favorite | `PATCH /kirtan/tracks/{id}/favorite` | `useToggleFavoriteMutation` | `KirtanLibraryPage.tsx` — heart button |
| Delete Track | `DELETE /kirtan/tracks/{id}` | `useDeleteKirtanTrackMutation` | `KirtanLibraryPage.tsx` — TrackDetailPanel delete |
| Upload Audio | `POST /kirtan/tracks/{id}/audio` | `useUploadKirtanAudioMutation` | `KirtanLibraryPage.tsx` — TrackDetailPanel upload button |

---

## Naam Jap APIs — Fully Integrated (Session 4)

Backend built from scratch. Frontend fully integrated replacing all mock data.

| API | Endpoint | Frontend Hook | Used In |
|-----|----------|--------------|---------|
| Get Target | `GET /naam-jap/target` | `useNaamTargetQuery` | `NaamJapPage.tsx` — target card |
| Set Target | `POST /naam-jap/target` | `useSetNaamTargetMutation` | `NaamJapPage.tsx` — Edit Goal modal |
| Get Today Entries | `GET /naam-jap/today` | `useTodayEntriesQuery` | `NaamJapPage.tsx` — Today's Sessions section |
| Add Entry | `POST /naam-jap/entries` | `useAddJapEntryMutation` | `NaamJapPage.tsx` — Log Chanting modal |
| Delete Entry | `DELETE /naam-jap/entries/{id}` | `useDeleteJapEntryMutation` | `NaamJapPage.tsx` — entry delete button |
| Get History | `GET /naam-jap/history` | `useNaamJapHistoryQuery` | `NaamJapPage.tsx` — Chanting History accordion |

---

## Real-time Friends Events — Implemented (Session 4)

WebSocket push events added to friends actions via the existing `/chat/ws` endpoint.

| Event | Triggered By | Sent To | Frontend Action |
|-------|-------------|---------|-----------------|
| `friend_request` | `POST /friends/request` | receiver | Invalidates incoming requests query |
| `friend_accepted` | `PATCH /friends/requests/{id}/accept` | sender | Invalidates friends list + outgoing queries |
| `friend_rejected` | `PATCH /friends/requests/{id}/reject` | sender | Invalidates outgoing requests query |

---

## UI Improvements (Session 4)

| Page | Change |
|------|--------|
| `NaamJapPage.tsx` | Full rewrite — real API integration, improved stat cards, quick-log preset buttons, goal summary grid, streak display, better history accordion, animated progress bar |
| `KirtanLibraryPage.tsx` | Audio player (`<audio controls>`), external link button, delete track button, real API |
| All pages | Removed outer container `max-w-*` constraints: FriendsPage, DiscoverPage, DashboardHome, SettingsPage, SchedulePage, SharedPage, SlokaDetail |

---

## Database Migrations

| Migration | Revision | Status |
|-----------|----------|--------|
| `add_social_features_chat_permissions_links` | `f93d7b6a67f1` | ✅ Applied |
| `add_kirtan_tracks_naamjap` | `d862a81e5a79` | ✅ Applied (head) |

---

## Servers Verified

| Server | Port | Status |
|--------|------|--------|
| uvicorn | 8009 | ✅ Running, no errors |
| Celery worker | — | ✅ Running (-P solo) |
| `components/auth/PublicRoute.tsx` | Redirect-if-authenticated public route guard |

---

## Schedule / Check-in APIs — Fully Integrated (Latest Session)

| API | Endpoint | Frontend Hook | Used In |
|-----|----------|--------------|---------|
| Update Check-in | `PATCH /schedule/checkins/{id}` | `useUpdateCheckInMutation` | `SchedulePage.tsx` — edit check-in history modal |
| Get Schedules (used in check-in detail) | `GET /schedule/templates` | `useScheduleTemplatesQuery` | `SchedulePage.tsx` — "View Schedule Used" modal |

---

## Frontend-only Features — Latest Session

| Feature | Files Changed | Description |
|---------|--------------|-------------|
| Edit Check-in History | `SchedulePage.tsx` | Edit button on each check-in row; opens edit modal pre-filled with existing data |
| View Schedule Used | `SchedulePage.tsx` | Per-check-in button shows which timetable was used (via schedule_version snapshot) |
| Floating Media Player | `src/context/MediaPlayerContext.tsx` (NEW), `src/components/shared/FloatingMediaPlayer.tsx` (NEW), `src/App.tsx`, `src/pages/DashboardLayout.tsx` | Persistent audio + YouTube player in bottom-right corner; continues playing across page navigation; YouTube uses `visibility:hidden` to keep iframe alive when on Kirtan page |
| Kirtan Page → Context | `src/pages/KirtanLibraryPage.tsx` | Wired to `MediaPlayerContext` so track state is shared with floating player |
| DM Scroll Pagination | `src/lib/api/endpoints/chat.ts`, `src/pages/MessagesPage.tsx` | Added `useMessagesInfiniteQuery`; messages now load 20 at a time; scroll to top of container triggers `fetchNextPage`; scroll position preserved after prepend |
| Video Calling | `src/pages/MessagesPage.tsx` | Added `<Video>` button alongside `<Phone>` in DM header; `useWebRTCCall` upgraded with `getUserMedia({video})`, `localVideoRef`, `remoteVideoRef`; `call_offer` WS event now includes `video: boolean` flag; connected overlay shows remote video + local PiP |

---

## New Files Created — Latest Session

| File | Purpose |
|------|---------|
| `src/context/MediaPlayerContext.tsx` | Global media player state; persistent `<audio>` ref in DOM; `playTrack`, `togglePlay`, `nextTrack`, `prevTrack`, `seekTo`, `stopPlayer` actions |
| `src/components/shared/FloatingMediaPlayer.tsx` | Floating player card (bottom-right); single `<iframe>` for YouTube with `visibility:hidden` when on Kirtan page; postMessage `playVideo`/`pauseVideo` commands |

---

## Entity Permissions — Bug Fix (Latest Session)

| File | Fix |
|------|-----|
| `app/repositories/entity_permissions.py` | Fixed 3 wrong message key lookups: `PERMISSIONS_RETRIEVED` → `RETRIEVED`, `PERMISSION_UPDATED` → `UPDATED` — was causing 500 errors on GET and PATCH permission endpoints |

---

## Group Roles & Online Status — Backend + Frontend (Current Session)

### Backend Changes
| File | Change |
|------|--------|
| `app/schemas/group.py` | Added `UpdateGroupRequest`, `UpdateMemberRoleRequest`; added `role`, `is_online`, `last_seen_at` to `GroupMemberResponse`; added `avatar_url`, `members` list to `GroupResponse` |
| `app/repositories/group.py` | Added `update_group()`, updated `add_member()` with role param, added `update_member_role()` |
| `app/services/group.py` | Full rewrite: roles (owner/co_admin/member), online status via `last_seen_at`, `edit_group()`, `update_member_role()`, `leave_group()` WS broadcast |
| `app/api/v1/routes/group.py` | Added `PATCH /groups/{id}` and `PATCH /groups/{id}/members/{user_id}/role` endpoints |
| `app/api/v1/routes/chat.py` | Updates `user.last_seen_at` on WebSocket disconnect |
| `alembic/versions/a1b2c3d4e5f6_add_group_roles_user_last_seen.py` | Migration: `group_members.role`, `group_conversations.avatar_url`, `users.last_seen_at` |

### New Group APIs
| API | Endpoint | Frontend Hook | Used In |
|-----|----------|--------------|---------|
| Edit Group | `PATCH /groups/{id}` | `useUpdateGroupMutation` | `lib/api/endpoints/groups.ts` (ready) |
| Update Member Role | `PATCH /groups/{id}/members/{uid}/role` | `useUpdateMemberRoleMutation` | `lib/api/endpoints/groups.ts` (ready) |

### Frontend Changes
| File | Change |
|------|--------|
| `src/types/index.ts` | Added `GroupRole`, extended `GroupMemberResponse` (role, is_online, last_seen_at), extended `GroupResponse` (avatar_url, members), added `UpdateGroupRequest`, `UpdateMemberRoleRequest`, added `last_seen_at` to `User` |
| `src/lib/api/endpoints/groups.ts` | Added `updateGroup`, `updateMemberRole` API functions + hooks; added `group_left`/`group_updated` socket handlers |
| `src/lib/api/endpoints/chat.ts` | Added `group_left`/`group_updated` to WS outer condition and inner handler |

---

## Permission Management UI — New Pages (Current Session)

| API | Endpoint | Frontend Hook | Used In |
|-----|----------|--------------|---------|
| List My Permissions | `GET /permissions/mine` | `useMyGrantedPermissionsQuery` | `PermissionsPage.tsx` |
| Review Content Request | `PATCH /content-requests/{id}/review` | `useReviewContentRequestMutation` | `ApprovalsPage.tsx` |
| List Incoming Requests | `GET /content-requests/incoming` | `useIncomingContentRequestsQuery` | `ApprovalsPage.tsx` |

### New Files
| File | Purpose |
|------|---------|
| `src/pages/PermissionsPage.tsx` | Permissions management — lists all grants made by caller, filter by type, revoke button |
| `src/pages/ApprovalsPage.tsx` | Content request review — approve/reject incoming requests, filter by status |
| `src/lib/api/endpoints/contentRequests.ts` | All content request API hooks |

### Routes / Navigation
| Change | File |
|--------|------|
| Added `/dashboard/permissions` and `/dashboard/approvals` routes | `src/App.tsx` |
| Added "Sharing" nav group (Permissions + Approvals) to sidebar | `src/components/dashboard/DashboardSidebar.tsx` |

---

## Schedule Page Redesign — UI Layout (Current Session)

| File | Change |
|------|--------|
| `src/pages/SchedulePage.tsx` | Redesigned with Kirtan-style left/right split: gradient hero banner with stats, `grid grid-cols-1 lg:grid-cols-3` split, left panel (Active Schedule + Progress/Reward card), right panel (Check-in History). All state, logic, and modal code preserved. |
