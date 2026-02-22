# Codebase Guide

## Overview

This project is an anonymous employee feedback platform built with:

- Next.js App Router (`app/*`) for pages and API routes
- Prisma + MySQL (`backend/prisma/schema.prisma`) for persistence
- NextAuth credentials auth for admin access
- Tailwind CSS + reusable UI components (`frontend/components/*`)

The frontend and backend APIs live in the same Next.js app.

---

## High-Level Structure

```text
employee-feedback-platform/
├── app/                          # Pages, layouts, API routes
│   ├── (public)/                 # Employee-facing routes
│   ├── admin/                    # Admin routes
│   └── api/                      # Backend endpoints
├── backend/
│   ├── prisma/schema.prisma      # Data model
│   ├── lib/                      # DB client, auth, validations, utils
│   └── types/                    # Shared TS types
└── frontend/components/
    ├── feedback/                 # Submit/feed/thread UI
    ├── admin/                    # Admin table + reward UI
    ├── layout/                   # Sidebar navigation
    └── ui/                       # Base components
```

---

## Backend Core

### Database Schema
File: `backend/prisma/schema.prisma`

Main models:

- `Feedback`: core submission (content, category, status, upvotes, submitter session)
- `FeedbackComment`: threaded comments (`parentId` enables nesting)
- `Upvote`: unique upvote per `(feedbackId, sessionId)`
- `Reward`: one reward per feedback, with claim code + redeem status
- `ActivityLog`: audit trail (`CREATED`, `UPVOTED`, `COMMENTED`, `REWARDED`, `REDEEMED`, etc.)

Enums include:

- `FeedbackCategory`: `CULTURE`, `TOOLS`, `WORKLOAD`, `MANAGEMENT`, `OTHER`
- `FeedbackStatus`: `PENDING`, `REVIEWED`, `IN_PROGRESS`, `RESOLVED`
- `RewardType`: `PROMO_CODE`, `HOLIDAY_DAY`
- `RewardStatus`: `AWARDED`, `REDEEMED`

### Backend Libraries

- `backend/lib/db.ts`: Prisma singleton client
- `backend/lib/auth.ts`: NextAuth credentials provider using `.env` admin credentials
- `backend/lib/validations.ts`: zod schemas for feedback, upvotes, comments, rewards
- `backend/lib/utils.ts`: shared className merge helper (`cn`)
- `backend/types/index.ts`: shared app types (`FeedbackWithMeta`, `ThreadComment`, etc.)

---

## API Routes

### Feedback

- `app/api/feedback/route.ts`
  - `GET`: list feedback with optional category/sort + comment count + `hasUpvoted`
  - `POST`: create new feedback and log `CREATED`

- `app/api/feedback/[id]/upvote/route.ts`
  - `POST`: toggle upvote for current session and update `feedback.upvotes`

- `app/api/feedback/[id]/comments/route.ts`
  - `GET`: fetch discussion comments for a feedback item
  - `POST`: add comment/reply (`parentId`), validate parent, log `COMMENTED`

- `app/api/feedback/[id]/reward/route.ts`
  - `POST` (admin only): award reward, generate claim code
  - Enforces monthly limit: max 3 rewards per submitter session

### Rewards

- `app/api/rewards/route.ts`
  - `GET`: fetch rewards belonging to current session submitter

- `app/api/rewards/redeem/route.ts`
  - `POST`: redeem reward via claim code + session ownership check

### Auth

- `app/api/auth/[...nextauth]/route.ts`
  - NextAuth route handler for session/sign-in flow

---

## Frontend Pages

- `app/page.tsx`: overview landing page
- `app/(public)/submit/page.tsx`: submit anonymous feedback
- `app/(public)/feedback/page.tsx`: feedback feed + discussion threads
- `app/(public)/rewards/page.tsx`: user rewards + redeem actions
- `app/admin/page.tsx`: admin dashboard (protected)
- `app/admin/login/page.tsx`: admin sign-in

Layouts:

- `app/layout.tsx`: root layout + providers
- `app/(public)/layout.tsx`: public workspace shell with sidebar
- `app/admin/layout.tsx`: admin shell with sidebar

---

## Frontend Components

### Feedback Area

- `frontend/components/feedback/FeedbackForm.tsx`
  - Anonymous form submission, guided prompts by category
- `frontend/components/feedback/FeedbackFeed.tsx`
  - Client filtering/sorting, upvote actions, thread mounting
- `frontend/components/feedback/FeedbackCard.tsx`
  - Feedback card display (category/status/admin note)
- `frontend/components/feedback/FeedbackThread.tsx`
  - Reddit-style threaded discussion with replies, expand/collapse
- `frontend/components/feedback/session.ts`
  - Creates and stores anonymous session ID in localStorage

### Admin Area

- `frontend/components/admin/FeedbackTable.tsx`
  - Moderation table + reward award panel

### Navigation/UI

- `frontend/components/layout/SidebarNavigation.tsx`
  - Collapsible left nav with route groups
- `frontend/components/ui/sidebar.tsx`
  - Sidebar primitives (`SidebarProvider`, `Sidebar`, `SidebarTrigger`, etc.)
- `frontend/components/ui/*`
  - Base primitives (`Button`, `Badge`, `Card`, `Textarea`)

---

## Auth and Session Model

- Admin auth: NextAuth credentials with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- Employee anonymity: client-generated `efp_session_id` in localStorage.
- Session ID is used for:
  - upvote uniqueness
  - submitter ownership (rewards/redeem)
  - comment author labels (`Anon-XXXX`)

---

## Key Flows

1. Submit feedback
   - User submits form -> `POST /api/feedback`
   - Feedback stored with `submitterSessionId`

2. Engage in feed
   - User views feed -> `GET /api/feedback`
   - User upvotes -> `POST /api/feedback/:id/upvote`
   - User joins discussion -> `GET/POST /api/feedback/:id/comments`

3. Admin rewards feedback
   - Admin signs in
   - Admin awards item -> `POST /api/feedback/:id/reward`
   - Claim code generated and attached to feedback reward

4. User redeems reward
   - User opens rewards -> `GET /api/rewards`
   - Redeems claim code -> `POST /api/rewards/redeem`

---

## Current Gaps / Notes

- Status and admin note fields exist in schema and UI, but there is no API yet to update feedback status or admin notes.
- Feed page initially loads feedback server-side, but category/sort behavior is mostly client-side after load.
- `ActivityLog` is written in APIs but not surfaced in any admin activity timeline page yet.
