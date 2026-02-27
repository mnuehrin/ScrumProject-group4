# Employee Feedback Platform

An anonymous employee feedback platform built with Next.js 14, Prisma (MySQL), and NextAuth. Employees submit feedback anonymously, engage with posts via comments and votes, and admins moderate submissions through a protected dashboard with analytics and CSV export.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + tailwindcss-animate |
| Database ORM | Prisma 5 (MySQL) |
| Authentication | NextAuth v4 — Credentials provider (JWT sessions) |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts 3 |
| UI Primitives | Radix UI + class-variance-authority (shadcn-style) |
| Icons | Lucide React |

---

## Prerequisites

- **Node.js** 18+
- **MySQL** 8.0+ running locally (or a remote MySQL instance)
- **npm** 9+

---

## Setup & Installation

### 1. Install dependencies

```bash
cd employee-feedback-platform
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in all four values:

```env
# MySQL connection string
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/feedback_db"

# Random secret for signing JWTs — generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here"

# URL of your running app (use localhost for development)
NEXTAUTH_URL="http://localhost:3000"

# Admin login credentials
ADMIN_EMAIL="admin@yourcompany.com"
ADMIN_PASSWORD="your-secure-password"
```

> **Security note:** `.env` is gitignored and must never be committed. All secrets are validated at runtime.

### 3. Create the database

Ensure your MySQL server is running, then create the database:

```sql
CREATE DATABASE feedback_db;
```

### 4. Push the schema & generate Prisma client

```bash
npm run prisma:generate   # generates the Prisma client from schema
npm run prisma:migrate    # pushes schema to the database (db push)
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server (requires `build` first) |
| `npm run lint` | Run ESLint |
| `npm run prisma:generate` | Regenerate Prisma client after schema changes |
| `npm run prisma:migrate` | Push schema changes to the database |

> **Note:** Both Prisma scripts use the `--schema=backend/prisma/schema.prisma` flag automatically — the `package.json` `"prisma"` field also points to this path for `npx prisma` commands.

---

## Project Structure

```
employee-feedback-platform/
│
├── app/                              # Next.js App Router
│   ├── (public)/                     # Employee-facing pages (no auth)
│   │   ├── page.tsx                  # Home / overview page
│   │   ├── layout.tsx                # Public layout with sidebar nav
│   │   ├── submit/page.tsx           # Anonymous feedback submission form
│   │   ├── feedback/page.tsx         # Public feed — browse, filter, vote
│   │   ├── questions/page.tsx        # Live Q&A feed
│   │   └── rewards/page.tsx          # Reward redemption page
│   │
│   ├── admin/                        # Admin-only area (protected by NextAuth)
│   │   ├── page.tsx                  # Moderation dashboard — feedback table
│   │   ├── layout.tsx                # Admin layout with sidebar nav
│   │   ├── error.tsx                 # Admin error boundary
│   │   ├── login/page.tsx            # Admin sign-in page
│   │   ├── dashboard/page.tsx        # Analytics dashboard (charts + KPIs)
│   │   │   └── _components/          # Chart sub-components (server-side)
│   │   │       ├── category-chart.tsx
│   │   │       ├── status-chart.tsx
│   │   │       └── submissions-chart.tsx
│   │   └── questions/page.tsx        # Q&A campaign management
│   │
│   ├── api/                          # API route handlers
│   │   ├── auth/[...nextauth]/       # NextAuth session handler
│   │   ├── feedback/
│   │   │   ├── route.ts              # GET all feedback, POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts          # GET single, DELETE
│   │   │       ├── comments/         # GET + POST comments (threaded)
│   │   │       ├── reviewed/         # PATCH reviewed boolean
│   │   │       ├── reward/           # POST award reward to feedback
│   │   │       ├── status/           # PATCH workflow status
│   │   │       ├── upvote/           # POST legacy upvote toggle
│   │   │       └── vote/             # POST up/down vote with sessionId
│   │   ├── questions/
│   │   │   ├── route.ts              # GET live Q&A questions
│   │   │   └── [id]/
│   │   │       ├── responses/        # GET + POST threaded responses
│   │   │       └── vote/             # POST up/down vote on question
│   │   ├── campaigns/
│   │   │   └── active/route.ts       # GET currently live campaign
│   │   ├── rewards/
│   │   │   ├── route.ts              # GET rewards list
│   │   │   └── redeem/route.ts       # POST redeem by claim code
│   │   └── admin/
│   │       ├── campaigns/            # CRUD for campaigns + questions (admin only)
│   │       ├── feedback/export/      # GET — download feedback as CSV
│   │       ├── trends/               # GET — analytics trend data
│   │       ├── migrate/link-questions/ # One-time migration utility
│   │       └── reset/                # POST — reset database (dev only)
│   │
│   ├── globals.css                   # Global Tailwind + CSS variable tokens
│   └── layout.tsx                    # Root layout (SessionProvider, ThemeProvider)
│
├── frontend/
│   └── components/
│       ├── feedback/                 # Feedback-related UI components
│       │   ├── FeedbackForm.tsx      # Submission form with guided prompts
│       │   ├── FeedbackFeed.tsx      # Feed with filter/sort/vote
│       │   ├── FeedbackCard.tsx      # Individual feedback card
│       │   ├── FeedbackSidePanel.tsx # Slide-out detail panel
│       │   ├── FeedbackThread.tsx    # Threaded comment view
│       │   ├── QuestionThread.tsx    # Threaded Q&A response view
│       │   ├── EmojiReactionPicker.tsx
│       │   └── session.ts            # localStorage session ID utility
│       ├── admin/
│       │   └── FeedbackTable.tsx     # Admin moderation table (interactive)
│       ├── layout/
│       │   ├── SidebarNavigation.tsx # Main sidebar nav
│       │   ├── NavbarTitle.tsx       # Top navbar title bar
│       │   └── ThemeToggle.tsx       # Dark/light mode toggle
│       ├── ui/                       # Base design system components
│       │   ├── badge.tsx
│       │   ├── button.tsx
│       │   ├── card.tsx
│       │   ├── category-pills.tsx
│       │   ├── sidebar.tsx
│       │   └── textarea.tsx
│       └── providers.tsx             # SessionProvider wrapper (client component)
│
├── backend/
│   ├── lib/
│   │   ├── db.ts                     # Prisma client singleton
│   │   ├── auth.ts                   # NextAuth options (credentials provider)
│   │   ├── utils.ts                  # Shared utility functions
│   │   └── validations.ts            # Zod schemas for all API inputs
│   ├── prisma/
│   │   └── schema.prisma             # Database schema (see Data Model section)
│   └── types/
│       └── index.ts                  # Shared TypeScript types (FeedbackWithMeta, etc.)
│
├── lib/
│   └── utils.ts                      # cn() helper (clsx + tailwind-merge)
│
├── public/
│   └── *.webp                        # Static assets (ASU logo)
│
├── .env.example                      # Environment variable template
├── next.config.js                    # Next.js config (reactStrictMode)
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config with path aliases
├── components.json                   # shadcn/ui config
└── package.json
```

---

## Path Aliases

Configured in `tsconfig.json` — use these imports everywhere:

| Alias | Resolves to | Use for |
|---|---|---|
| `@/components/*` | `frontend/components/*` | All React UI components |
| `@/lib/*` | `backend/lib/*` | DB client, auth, utils, validations |
| `@/types/*` | `backend/types/*` | Shared TypeScript types |

---

## Application Routes

### Public (Employee-Facing)

| Route | Description |
|---|---|
| `/` | Home page — navigation hub |
| `/submit` | Anonymous feedback form with category selection and guided prompt responses |
| `/feedback` | Public feed — filter by category, sort newest/top, vote on posts, threaded comments |
| `/questions` | Live Q&A feed — view and respond to admin-created questions |
| `/rewards` | Redeem a reward using a claim code |

### Admin (Protected — requires login)

| Route | Description |
|---|---|
| `/admin/login` | Admin sign-in (email + password) |
| `/admin` | Moderation dashboard — feedback table with review checkbox, status badge, reward badge, delete |
| `/admin/dashboard` | Analytics dashboard — KPI cards, submissions over time chart, category donut chart, status bar chart |
| `/admin/questions` | Campaign and Q&A question management |

---

## API Reference

### Feedback

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/feedback` | None | List feedback (filterable by category, sort) |
| `POST` | `/api/feedback` | None | Submit new anonymous feedback |
| `GET` | `/api/feedback/[id]` | None | Get single feedback item |
| `DELETE` | `/api/feedback/[id]` | Admin | Delete feedback |
| `PATCH` | `/api/feedback/[id]/status` | Admin | Update workflow status |
| `PATCH` | `/api/feedback/[id]/reviewed` | Admin | Toggle reviewed boolean |
| `POST` | `/api/feedback/[id]/vote` | None | Cast up/down vote (sessionId-based) |
| `GET` | `/api/feedback/[id]/comments` | None | Get threaded comments |
| `POST` | `/api/feedback/[id]/comments` | None | Post a comment (optionally reply to parent) |
| `POST` | `/api/feedback/[id]/reward` | Admin | Award a reward to feedback author |

### Questions & Campaigns

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/questions` | None | List all Q&A questions |
| `POST` | `/api/questions/[id]/responses` | None | Submit a response |
| `POST` | `/api/questions/[id]/vote` | None | Vote on a question |
| `GET` | `/api/campaigns/active` | None | Get the currently live campaign |
| `GET/POST` | `/api/admin/campaigns` | Admin | List / create campaigns |
| `GET/PATCH/DELETE` | `/api/admin/campaigns/[id]` | Admin | Manage a campaign |
| `POST` | `/api/admin/campaigns/[id]/questions` | Admin | Add a question to a campaign |

### Admin Utilities

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/feedback/export` | Admin | Download all feedback as a CSV file |
| `GET` | `/api/admin/trends` | Admin | Aggregated trend data for analytics |

### Rewards

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/rewards` | None | List rewards associated with session |
| `POST` | `/api/rewards/redeem` | None | Redeem a reward by claim code + sessionId |

---

## Data Model

```
Feedback          — core submission (content, category, status, reviewed boolean)
  ├── FeedbackComment    — threaded comments on a feedback post
  ├── FeedbackPromptResponse — guided prompt answers attached to a submission
  ├── Upvote             — per-session vote record (UP/DOWN)
  ├── ActivityLog        — audit log (CREATED, STATUS_CHANGED, REWARDED, etc.)
  └── Reward             — single reward attached to a feedback (PROMO_CODE / HOLIDAY_DAY)

Campaign          — admin-created feedback campaign
  └── Question    — questions belonging to a campaign
        ├── QuestionResponse  — threaded employee responses to a question
        ├── QuestionVote      — per-session vote on a question
        └── FeedbackPromptResponse — links back to Feedback when answered during submission
```

**Key design decisions:**
- All IDs are UUIDs (`@default(uuid())`)
- Employee identity is never stored — anonymous sessions use a `sessionId` generated client-side and stored in `localStorage` under the key `efp_session_id`
- The `reviewed` boolean and `status` enum are independent fields — `reviewed` tracks whether an admin has seen the post; `status` tracks the workflow stage (PENDING → REVIEWED → IN_PROGRESS → RESOLVED)
- Campaign shadow records in `Feedback` (admin-created question prompts) are identified by `adminNote LIKE 'Campaign:%'` and filtered out of all employee-facing counts

---

## Authentication

- **Provider:** NextAuth Credentials (no OAuth)
- **Session strategy:** JWT (stateless, no database session table needed)
- **Credentials:** Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` — there is one admin account
- **Protected routes:** All `/admin/*` pages call `getServerSession()` server-side and redirect to `/admin/login` if unauthenticated. All `/api/admin/*` routes return `401` if no session

---

## Anonymous Session Tracking

Employees are identified by a randomly generated UUID stored in `localStorage`:

```ts
// Key: "efp_session_id"
// Generated once on first visit, persists across browser sessions
// Used for: voting, commenting, reward redemption
```

This is the only "identity" mechanism — no accounts, no cookies, no tracking beyond the session ID.

---

## CSV Export

`GET /api/admin/feedback/export` — admin only. Downloads `feedback-export.csv` with columns:

| Column | Description |
|---|---|
| `id` | UUID of the feedback record |
| `content` | Full feedback text |
| `category` | CULTURE / TOOLS / WORKLOAD / MANAGEMENT / OTHER |
| `status` | PENDING / REVIEWED / IN_PROGRESS / RESOLVED |
| `createdAt` | ISO 8601 timestamp |
| `adminNote` | Internal admin note (empty string if none) |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL connection string: `mysql://user:pass@host:port/dbname` |
| `NEXTAUTH_SECRET` | Yes | Secret for signing JWTs — use `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Full URL of the app (`http://localhost:3000` in development) |
| `ADMIN_EMAIL` | Yes | Email address for the admin login |
| `ADMIN_PASSWORD` | Yes | Password for the admin login |
