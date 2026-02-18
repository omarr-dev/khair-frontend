# Khair — Quranic Circle Management System

A full-featured web platform for managing Islamic Quranic teaching circles (Halaqat). Built for educational institutions to track student memorization progress, manage attendance, and generate supervisory analytics — all in a fully Arabic RTL interface.

---

## Features

- **Memorization Tracking** — Record daily progress by Surah, verse, and Juz for each student across memorization, revision, and consolidation
- **Attendance Management** — Track student and teacher attendance with consecutive-absence alerts
- **Achievement Streaks** — Leaderboard showing top-performing students based on daily streaks
- **Analytics & Reports** — Interactive charts with date-range filtering; export reports to Excel
- **Role-Based Access** — Separate views and permissions for Teachers, Supervisors, and Halaqa Supervisors
- **Multi-Tenant** — Supports multiple organizations with dynamic branding (logo, name) per subdomain
- **Dark Mode** — Full light/dark theme support
- **Offline Indicator** — Detects and displays connectivity status

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| UI Components | shadcn/ui + Radix UI |
| Styling | Tailwind CSS v4 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| HTTP Client | Axios |
| Tables | TanStack React Table |
| Notifications | Sonner |
| Theming | next-themes |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A running instance of the Khair backend API

### Installation

```bash
git clone https://github.com/omarr-dev/khair-frontend.git
cd khair-frontend
npm install
```

### Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (auth)/           # Login flow
│   └── (dashboard)/      # Protected dashboard pages
│       ├── home/
│       ├── my-students/
│       ├── halaqat/
│       ├── reports/
│       ├── follow-up/
│       └── teacher-attendance/
├── components/
│   ├── ui/               # shadcn/ui base components
│   ├── shared/           # Reusable app-level components
│   ├── layout/           # Sidebar and page layout
│   ├── students/         # Student dialogs and forms
│   └── manage/           # Admin management views
├── services/             # Axios API service layer
├── types/                # TypeScript interfaces and models
├── hooks/                # Custom React hooks
└── lib/                  # Utilities, Quran data, helpers
```

---

## Authentication

Login is phone-number based. On successful login, a JWT token is stored client-side and attached to all subsequent API requests via an Axios interceptor. Unauthorized responses (401) automatically redirect to the login page.

---

## License

This project is source-available. All rights reserved unless otherwise stated.
