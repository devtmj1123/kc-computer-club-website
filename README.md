# Kuen Cheng High School Computer Club Website

This is the official website for the Kuen Cheng High School Computer Club, built with Next.js 16, TypeScript, Tailwind CSS 4, and Appwrite.

**Project status:** the platform is in active real-world use at school and continues to be maintained and refined.

**Author:** Tan Ming Jing  
**Username:** devtmj1123

---

## Real-World Usage

This platform is maintained for the Kuen Cheng High School Computer Club.

- Serves 111 club members
- Used for attendance during weekly co-curricular sessions
- Supports project and homework status updates
- Allows teachers and administrators to review student progress
- Includes notices, activity applications, authentication, and role-based administration

The project is actively maintained and deployed for real school workflows.

---

## Overview

The repository currently includes:

- Student pages for home, about, notices, activities, attendance, projects, profile, tutorial, and authentication
- Project submission and editing flows
- Activity browsing, details, and signup flows
- Online attendance with verification code check-in
- Comments and community interaction
- A full admin area for managing notices, activities, projects, students, admins, signups, comments, attendance, and settings
- Appwrite-backed API routes for content, authentication, attendance, uploads, notifications, and admin workflows

---

## Key Pages

### Student-facing pages

- `/` Home
- `/about` About
- `/activities` Activities list
- `/notices` Notices list
- `/projects` Projects list
- `/projects/submit` Submit a project
- `/attendance` Attendance check-in
- `/profile` Profile
- `/tutorial` Tutorial
- `/auth/login` Login
- `/auth/forgot-password` Forgot password
- `/auth/reset-password` Reset password
- `/auth/change-password` Change password

### Admin pages

- `/admin` Admin entry
- `/admin/dashboard` Dashboard
- `/admin/activities` Activity management
- `/admin/notices` Notice management
- `/admin/projects` Project management
- `/admin/students` Student management
- `/admin/admins` Admin management
- `/admin/attendance` Attendance management
- `/admin/signups` Signup management
- `/admin/comments` Comment moderation
- `/admin/settings` System settings
- `/admin/manage` General management

---

## Tech Stack

- **Framework:** Next.js 16
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **State management:** Zustand
- **Forms:** react-hook-form + zod
- **Backend services:** Appwrite
- **Utilities:** Axios, date-fns, react-google-recaptcha-v3, xlsx, and more

---

## Project Structure

```text
src/
├── app/          # App Router pages and API routes
├── components/   # UI and feature components
├── contexts/     # React context providers
├── lib/          # Shared helpers and cache utilities
├── services/     # Appwrite and domain services
├── types/        # TypeScript types
└── utils/        # Utility functions
public/           # Static assets
scripts/          # Setup and maintenance scripts
docs/             # Supporting documentation
```

---

## Getting Started

### Requirements

- Node.js 18+
- npm
- An Appwrite instance

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your Appwrite configuration.

### 3. Start the development server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

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

# Appwrite and data setup
npm run setup:appwrite
npm run setup:attendance
npm run setup:projects
npm run seed:appwrite
npm run fix:attributes
npm run fix:grades
npm run fix:comments
```

There is currently no dedicated `npm test` script in this repository.

---

## Documentation

- [Database schema fix guide](./docs/FIX_DATABASE_SCHEMA.md)
- [GitHub Student Benefits tutorial](./docs/GITHUB_STUDENT_BENEFITS_TUTORIAL.md)
- [Attendance fixes](./ATTENDANCE_FIXES.md)
- [State update fixes](./STATE_UPDATE_FIXES.md)
- [Fix summary](./FIXES_SUMMARY.md)

---

## Notes

- The README reflects the current repository state and does not use the old phase-based roadmap.
- The project already has its main user and admin workflows in place, and it is actively maintained for school use.
- If you add new pages, scripts, or setup steps, update this file to keep it current.

---

## License

This project is licensed under the [MIT License](./LICENSE).