# Frontend Screen Analysis — API Integration Map

This document analyzes every frontend screen, identifies the APIs each one needs, and
tracks which are currently integrated, which are ready for integration, and which require
backend support that does not yet exist.

---

## Integration Status Legend

| Symbol | Meaning |
|--------|---------|
| :white_check_mark: | API endpoint exists in backend & frontend hook created |
| :hourglass: | API endpoint exists in backend but frontend not yet wired |
| :x: | No backend endpoint — backend work required |

---

## 1. Authentication Screens

All auth screens are **fully integrated** with API hooks.

### Login (`/login`)
| Operation | Endpoint | Hook | Status |
|-----------|----------|------|--------|
| Login with email/password | `POST /auth/login` | `useLoginMutation` | :white_check_mark: Integrated |

### Register (`/register`)
| Operation | Endpoint | Hook | Status |
|-----------|----------|------|--------|
| Create account | `POST /auth/register` | `useRegisterMutation` | :white_check_mark: Integrated |

### Verify OTP (`/verify-otp`)
| Operation | Endpoint | Hook | Status |
|-----------|----------|------|--------|
| Verify email token | `POST /auth/verify-email` | `useVerifyEmailMutation` | :white_check_mark: Integrated |
| Resend OTP code | `POST /auth/resend-otp` | `useResendOtpMutation` | :white_check_mark: Integrated |

### Forgot Password (`/forgot-password`)
| Operation | Endpoint | Hook | Status |
|-----------|----------|------|--------|
| Request reset email | `POST /auth/forgot-password` | `useForgotPasswordMutation` | :white_check_mark: Integrated |

### Reset Password (`/reset-password`)
| Operation | Endpoint | Hook | Status |
|-----------|----------|------|--------|
| Set new password | `POST /auth/reset-password` | `useResetPasswordMutation` | :white_check_mark: Integrated |

---

## 2. Dashboard Home (`/dashboard`)

Uses hardcoded mock data. Shows stats, pending approvals, activity feed, recent books/slokas.

| Operation | Endpoint | Hook | Status |
|-----------|----------|------|--------|
| Get user stats (book count, sloka count) | None | None | :x: Backend needed |
| Get pending approvals | None | None | :x: Backend needed (meanings/approvals module) |
| Get activity feed | None | None | :x: Backend needed (feed/notifications module) |
| List recent books | `GET /books/me` | `useMyBooksQuery` | :hourglass: Hook created, not wired |
| List recent slokas | `GET /shloks/book/{id}` | `useShloksByBookQuery` | :hourglass: Hook created, not wired |

---

## 3. Library — My Books (`/dashboard/library`)

Displays user's book collection with search, category filter, and create book modal.

| Operation | Endpoint | Hook | Status |
|-----------|----------|------|--------|
| List my books | `GET /books/me` | `useMyBooksQuery` | :hourglass: Hook created, not wired |
| Create book | `POST /books` | `useCreateBookMutation` | :hourglass: Hook created, not wired |
| Delete book | `DELETE /books/{id}` | `useDeleteBookMutation` | :hourglass: Hook created, not wired |
| Update book visibility | `PATCH /books/{id}` | `useUpdateBookMutation` | :hourglass: Hook created, not wired |

---

## 4. Book Slokas (`/dashboard/library/:bookId`)

Shows slokas within a book. Create sloka modal with rich text editor.

| Operation | Endpoint | Hook | Status |
|-----------|----------|------|--------|
| Get book detail | `GET /books/{id}` | `useBookDetailQuery` | :hourglass: Hook created, not wired |
| List slokas in book | `GET /shloks/book/{id}` | `useShloksByBookQuery` | :hourglass: Hook created, not wired |
| Create sloka | `POST /shloks` | `useCreateShlokMutation` | :hourglass: Hook created, not wired |
| Delete sloka | `DELETE /shloks/{id}` | `useDeleteShlokMutation` | :hourglass: Hook created, not wired |
| Change sloka visibility | `PATCH /shloks/{id}` | `useUpdateShlokMutation` | :hourglass: Hook created, not wired |

---

## 5. Sloka Detail (`/dashboard/slokas/:id`)

Detailed sloka view with meaning tree, voting, version history, and editing.

| Operation | Endpoint | Hook | Status |
|-----------|----------|------|--------|
| Get sloka detail | `GET /shloks/{id}` | `useShlokDetailQuery` | :hourglass: Hook created, not wired |
| Upload sloka audio | `POST /shloks/{id}/audio` | `useUploadShlokAudioMutation` | :hourglass: Hook created, not wired |
| Get related slokas | `GET /shloks/{id}/related` | `useShlokRelatedQuery` | :hourglass: Hook created, not wired |
| Get cross references | `GET /shloks/{id}/cross-references` | `useShlokCrossReferencesQuery` | :hourglass: Hook created, not wired |
| Add cross reference | `POST /shloks/{id}/cross-references` | `useAddCrossReferenceMutation` | :hourglass: Hook created, not wired |
| Add meaning (root/child) | None | None | :x: Backend needed (meanings module) |
| Edit meaning text | None | None | :x: Backend needed |
| Delete meaning | None | None | :x: Backend needed |
| Vote on meaning | None | None | :x: Backend needed (reactions module) |
| Get meaning version history | None | None | :x: Backend needed |
| Restore meaning version | None | None | :x: Backend needed |

---

## 6. Discover (`/dashboard/discover`)

Public books discovery page with follower counts.

| Operation | Endpoint | Hook | Status |
|-----------|----------|------|--------|
| List public books | `GET /books/public` | `usePublicBooksQuery` | :hourglass: Hook created, not wired |
| Follow/unfollow book | None | None | :x: Backend needed (followers module) |

---

## 7. Shared With Me (`/dashboard/shared`)

Books shared with the current user.

| Operation | Endpoint | Hook | Status |
|-----------|----------|------|--------|
| List books shared with me | None | None | :x: Backend needed (sharing/permissions listing) |
| Get sharing metadata (who, when) | None | None | :x: Backend needed |

---

## 8. Settings (`/dashboard/settings`)

Profile editing, blocked users, account deletion.

| Operation | Endpoint | Hook | Status |
|-----------|----------|------|--------|
| Get current user profile | `GET /auth/me` | Exists in auth.ts | :hourglass: Not wired to settings page |
| Update profile | `PATCH /auth/me` | Exists in auth routes | :hourglass: Not wired |
| Upload avatar | `POST /auth/me/avatar` | Exists in auth routes | :hourglass: Not wired |
| Get blocked users | None | None | :x: Backend needed |
| Unblock user | None | None | :x: Backend needed |
| Delete account | None | None | :x: Backend needed |

---

## 9. Naam Jap Tracker (`/dashboard/naam-jap`)

Chanting tracker with daily entries, targets, and streak tracking.

| Operation | Endpoint | Hook | Status |
|-----------|----------|------|--------|
| Get/set target | None | None | :x: Backend needed (naam-jap module) |
| Add daily entry | None | None | :x: Backend needed |
| Get daily history | None | None | :x: Backend needed |
| Get streak data | None | None | :x: Backend needed |

---

## 10. Schedule (`/dashboard/schedule`)

Daily schedule with version management, check-ins, and rewards.

| Operation | Endpoint | Hook | Status |
|-----------|----------|------|--------|
| CRUD schedule versions | None | None | :x: Backend needed (schedule module) |
| Daily check-in | None | None | :x: Backend needed |
| Get check-in history | None | None | :x: Backend needed |

---

## 11. Chat (`/dashboard/chat`)

AI-powered chat with message history.

| Operation | Endpoint | Hook | Status |
|-----------|----------|------|--------|
| Send message | None | None | :x: Backend needed (discussions/AI module) |
| Get chat history | None | None | :x: Backend needed |

---

## 12. Kirtan Library (`/dashboard/kirtan`)

New page — devotional music library with mini player.

| Operation | Endpoint | Hook | Status |
|-----------|----------|------|--------|
| All operations | None | None | :x: Uses hardcoded demo data. Backend kirtan module not planned yet |

---

## Summary

### Screens That Are Fully API-Integrated
- Login
- Register
- Verify OTP
- Forgot Password
- Reset Password

### Screens With Hooks Ready (Need Wiring)
- Library (My Books)
- Book Slokas
- Sloka Detail (partial — shlok CRUD only)
- Discover
- Settings (partial — auth/me)
- Dashboard Home (partial — recent books)

### Screens Requiring New Backend Modules
| Screen | Missing Backend Module |
|--------|-----------------------|
| Dashboard Home | Stats aggregation, Feed/Activity |
| Sloka Detail | Meanings CRUD, Voting/Reactions, Version History |
| Shared With Me | Sharing/permissions listing |
| Settings | Blocked users, Account deletion |
| Naam Jap | Full naam-jap module |
| Schedule | Full schedule module |
| Chat | AI/Discussion module |
| Kirtan Library | Kirtan/audio module |

---

## API Hooks Created in This Task

### `lib/api/endpoints/books.ts`
- `booksApi` object with: `createBook`, `listMyBooks`, `listPublicBooks`, `getBook`, `updateBook`, `deleteBook`, `uploadCover`
- Hooks: `useCreateBookMutation`, `useMyBooksQuery`, `usePublicBooksQuery`, `useBookDetailQuery`, `useUpdateBookMutation`, `useDeleteBookMutation`, `useUploadBookCoverMutation`

### `lib/api/endpoints/shloks.ts`
- `shloksApi` object with: `createShlok`, `listByBook`, `getShlok`, `updateShlok`, `deleteShlok`, `uploadAudio`, `getRelated`, `addCrossReference`, `getCrossReferences`
- Hooks: `useCreateShlokMutation`, `useShloksByBookQuery`, `useShlokDetailQuery`, `useUpdateShlokMutation`, `useDeleteShlokMutation`, `useUploadShlokAudioMutation`, `useShlokRelatedQuery`, `useAddCrossReferenceMutation`, `useShlokCrossReferencesQuery`

### `lib/api/queryKeys.ts`
- Centralized query key constants: `AUTH_ME`, `BOOKS_MY`, `BOOKS_PUBLIC`, `BOOK_DETAIL`, `SHLOKS_BY_BOOK`, `SHLOK_DETAIL`, `SHLOK_RELATED`, `SHLOK_CROSS_REFS`
