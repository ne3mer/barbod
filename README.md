# Barbod Barber

Production-quality, bilingual (English / Hungarian) appointment booking platform for independent beauty professionals. The data model is **multi-business from day one**, even though the first deployment may serve a single studio.

## Purpose

- **Public site**: landing, business profile, services, portfolio, and guest booking (no customer accounts).
- **Admin**: authenticated business owners manage appointments, availability, services, and portfolio media.

Out of scope for the MVP: payments, SMS, customer accounts, multi-location, and similar extras.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js (App Router), React Server Components where appropriate |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI | shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage, Row Level Security) |

## Architecture

```
src/
├── app/                           # Routes: /, /book, /admin, /admin/login
├── components/                    # Layout shells + shadcn/ui
├── config/                        # App-level constants (not tenant branding)
├── lib/
│   ├── env.ts
│   ├── supabase/                  # Typed browser + server clients
│   └── utils.ts
└── types/
    ├── database.ts                # Supabase Database types
    └── index.ts

supabase/
├── migrations/                    # Reproducible schema + RLS + storage
├── seed/                          # Manual first-business seed (no fake auth users)
└── README.md                      # Link, migrate, seed, RLS, storage
```

**Routing:** Route groups organize public vs admin layouts without changing URLs.

**Supabase:** Schema is migration-driven. Clients are typed with `Database` from `src/types/database.ts`. See `supabase/README.md` for RLS and storage details.

**Timezone:** Appointment/block times use `timestamptz`. Working-hour clock times are interpreted in `Europe/Budapest`.

**i18n:** Locales declared in `config/app.ts`; full EN/HU routing comes with content work.

## Setup

### Prerequisites

- Node.js 20+ (LTS recommended)
- npm
- A Supabase project

### Install and run

```bash
npm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Then create the owner account in Auth and run `supabase/seed/seed_barbod_barber.sql` with that user’s profile UUID. Full steps: [`supabase/README.md`](./supabase/README.md).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Push migrations to linked remote |
| `npm run db:types` | Regenerate types from local Supabase |

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (for data features) | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (for data features) | Anonymous/public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-only; never expose to the client |

## Current status

Phases 1–3 complete: scaffold, multi-tenant schema/RLS, and **admin authentication** (login, session proxy, protected `/admin`, logout, owner business dashboard overview). **Booking UI and full admin CRUD are not built yet.**

## Next step (Phase 4)

Admin core: services, working hours, blocked times, appointments list/calendar actions, and portfolio management behind the authenticated owner session.
