# Employee Feedback Platform

Next.js 14 + Tailwind CSS + Prisma (MySQL) + NextAuth

## Getting Started

```bash
npm install
cp .env.example .env
```

Edit `.env` and fill in:
- `DATABASE_URL` — MySQL connection string
- `NEXTAUTH_SECRET` — any random string (e.g. `openssl rand -base64 32`)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — admin login credentials

```bash
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
employee-feedback-platform/
├── app/                   # Next.js App Router (pages + API routes)
│   ├── (public)/          # Employee-facing pages
│   │   ├── submit/        # Anonymous feedback submission
│   │   └── feedback/      # Public feed with upvoting
│   ├── admin/             # Admin-only pages (protected by NextAuth)
│   │   └── login/         # Admin sign-in
│   └── api/               # API routes
│       ├── feedback/      # GET list, POST create, POST upvote
│       └── auth/          # NextAuth handler
├── frontend/
│   └── components/        # React UI components
│       ├── ui/            # Base components (Button, Badge, Card, Textarea)
│       ├── feedback/      # FeedbackForm, FeedbackCard, FeedbackFeed
│       └── admin/         # FeedbackTable
└── backend/
    ├── prisma/            # schema.prisma + migrations
    ├── lib/               # db.ts, auth.ts, utils.ts, validations.ts
    └── types/             # Shared TypeScript types
```

## Path Aliases

| Import | Resolves to |
|---|---|
| `@/components/*` | `frontend/components/*` |
| `@/lib/*` | `backend/lib/*` |
| `@/types/*` | `backend/types/*` |

## Routes

| Route | Description |
|---|---|
| `/` | Home — links to all sections |
| `/submit` | Anonymous feedback form |
| `/feedback` | Public feed with category filter, sort, upvote |
| `/admin` | Admin dashboard (requires login) |
| `/admin/login` | Admin sign-in |
