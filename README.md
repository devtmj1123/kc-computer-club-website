# Kuen Cheng High School Computer Club Website

Official website for the Kuen Cheng High School Computer Club, built with Next.js 16, TypeScript, Tailwind CSS 4, and Supabase (Postgres + Auth + Storage + RLS).

**Project status:** in active real-world use at school. The backend now runs on Supabase; Appwrite is no longer a dependency.

**Author:** Tan Ming Jing  
**Username:** devtmj1123

---

## Real-World Usage

- Serves 111 club members
- Weekly co-curricular attendance check-in
- Project submission, review, and checklist tracking
- Notices, activity signups, comments, and role-based administration
- Used by teachers and administrators to review student progress

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, `src/proxy.ts`)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Auth / data:** Supabase Auth + Postgres + RLS + Storage
- **Forms / validation:** react-hook-form + zod
- **Utilities:** date-fns, react-google-recaptcha-v3, xlsx, Resend

---

## Project Structure

```text
src/
├── app/          # App Router pages and API routes
├── components/   # UI and feature components
├── contexts/     # React context providers
├── lib/          # Shared helpers (session, rate limit, Supabase clients)
├── services/     # Domain data services (Supabase)
├── types/        # TypeScript types
└── proxy.ts      # Next 16 session refresh boundary
public/           # Static assets
scripts/          # Setup, maintenance and migration scripts
supabase/         # SQL migrations (schema, functions, RLS, storage)
docs/             # Migration and UI planning documents
```

---

## Key Pages

### Student-facing

- `/` home
- `/about`
- `/activities`, `/activities/[id]`, `/activities/[id]/signup`
- `/notices`, `/notices/[id]`
- `/projects`, `/projects/[id]`, `/projects/submit`
- `/attendance`
- `/profile`
- `/tutorial`
- `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password`

### Admin

- `/admin`
- `/admin/notices` (+ create/edit)
- `/admin/activities` (+ create/edit/signups)
- `/admin/projects`
- `/admin/students` (+ create/edit)
- `/admin/attendance` (+ session/detail)
- `/admin/signups`
- `/admin/comments`
- `/admin/settings`
- `/admin/manage` (+ create/edit)

Removed duplicate/dead routes (`/admin/admins`, `/admin/dashboard`, `/club-settings`, `/chat`, `/help`, `/privacy`, `/terms`) redirect or return 404 by design.

---

## Getting Started

### Requirements

- Node.js 20+
- npm
- A Supabase project (Singapore / Pro recommended)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values you need.

- Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Set `ADMIN_SESSION_SECRET`, `STUDENT_SESSION_SECRET`, and `RESET_TOKEN_SECRET` to long random strings.
- Set `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY` from the same reCAPTCHA v3 key pair. The site key is public; the secret must stay server-side. If the secret is missing, verification is skipped (a warning is logged in production).
- Set `SMTP_HOST` and `SMTP_FROM_EMAIL` (plus `SMTP_USER` / `SMTP_PASS` if your mail server needs authentication) to enable password reset emails. Resend remains optional via `RESEND_API_KEY` / `RESEND_FROM_EMAIL`.

The full fresh-database checklist is in [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md).

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Supabase Setup

SQL migrations live in `supabase/migrations/` and must be applied in order:

1. `0001_schema.sql` — tables, enums, indexes, default settings
2. `0002_functions.sql` — helper functions, triggers, attendance RPC
3. `0003_rls.sql` — Row Level Security policies
4. `0004_storage.sql` — Storage buckets and policies
5. `0005_admin_recovery_email.sql` — real recovery mailbox for admin password resets

Apply them with the Supabase CLI (`supabase db push`) or the SQL Editor.

Then create the first administrator:

```bash
npm run bootstrap:supabase
```

This repository does not migrate old Appwrite data. Supabase starts as an
empty database and accounts are created through the admin UI, the student import,
or `scripts/bootstrap-supabase.ts`.

Validate the SQL before applying it:

```bash
npm run db:verify
```

`npm run db:verify` runs `0001` → `0004` against PGlite with stand-ins for the
Supabase `auth`/`storage` schemas and checks RLS visibility, protected fields,
the signup counter, the check-in RPC, the safe attendance view, and storage
policies. It needs no Supabase project.

See `docs/SUPABASE_SETUP.md` for the step-by-step setup and `docs/SUPABASE_MIGRATION_PLAN.md` for the schema/RLS/Auth design.

---

## Available Scripts

```bash
# Development
npm run dev
npm run build
npm run start

# Code quality
npm run lint
npm run format
npm run format:check
npm run type-check

# Supabase
npm run db:verify
npm run db:check
npm run db:smoke
npm run bootstrap:supabase
```

There is currently no dedicated `npm test` script.

---

## Security Notes

- Authentication is enforced by httpOnly signed cookies (`kc_student_session`, `kc_admin_session`) and server-side checks. `localStorage` is a UI cache only.
- Admin write routes require an admin session.
- Public comments are moderated (`pending` → `approved`) and anonymous signups are verified with reCAPTCHA when configured.
- Student PII is not returned by public list endpoints.

---

## Documentation

- [Supabase migration plan](./docs/SUPABASE_MIGRATION_PLAN.md)
- [Implementation roadmap](./docs/IMPLEMENTATION_ROADMAP.md)
- [UI/UX audit](./docs/UI_UX_AUDIT.md)
- [Audit findings](./findings.md)
- [Current progress](./progress.md)

---

## License

This project is licensed under the [MIT License](./LICENSE).
