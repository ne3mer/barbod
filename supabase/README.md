# Supabase (database, auth, storage)

This project’s schema, RLS policies, and storage setup live as SQL migrations in `migrations/`. Apply them from the repo — do not rely on one-off dashboard edits for structure.

## Prerequisites

- A [Supabase](https://supabase.com) project
- Supabase CLI (`npx supabase` is enough; global install optional)
- Node.js 20+

## Link the project

```bash
# From the repo root
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

Project ref is in the Supabase dashboard URL: `https://supabase.com/dashboard/project/<ref>`.

Copy API keys into `.env.local` (see root `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Run migrations

**Remote (hosted project):**

```bash
npx supabase db push
```

**Local (requires Docker):**

```bash
npx supabase start
npx supabase db reset   # applies all migrations + optional seed config
```

Migrations are ordered by filename timestamp under `migrations/`.

| Migration | Purpose |
| --- | --- |
| `20260930220000_extensions_and_helpers.sql` | `btree_gist`, `set_updated_at()` |
| `20260930220100_core_tables.sql` | Tables, FKs, indexes, exclusion constraint, triggers |
| `20260930220200_rls_policies.sql` | Row Level Security policies |
| `20260930220300_storage_portfolio.sql` | `portfolio` bucket + storage policies |
| `20260930220400_grants.sql` | Grants for `anon` / `authenticated` |

## Create the initial business (manual seed)

Do **not** invent `auth.users` rows. Sign up the real owner first (Auth → Users, or the future `/admin/login` flow), then:

1. In SQL Editor:

```sql
SELECT id, full_name FROM public.profiles;
```

2. Open `seed/seed_barbod_barber.sql`, set `v_owner_id` to that UUID, run the script.

It creates business slug `barbod-barber` and default working hours:

- Mon–Sat `15:00`–`20:30` (local wall-clock for **Europe/Budapest**)
- Sunday closed (no `working_hours` rows)

Working hours are editable later from admin; the seed is only defaults.

## Timezone model

| Data | Storage |
| --- | --- |
| Appointments / blocked times | `timestamptz` (absolute instants) |
| Working hours `start_time` / `end_time` | `time` (Budapest wall-clock) |

Availability logic (Phase 3+) must interpret working hours in `Europe/Budapest` and compare against `timestamptz` appointment ranges.

## Multi-tenancy & RLS

Ownership is always `businesses.owner_id = auth.uid()` (via `profiles`). Helper: `public.is_business_owner(business_id)`.

| Table | Public (anon) | Owner (authenticated) |
| --- | --- | --- |
| `profiles` | — | SELECT/UPDATE own row |
| `businesses` | SELECT | Full CRUD on own businesses |
| `services` | SELECT active | Full CRUD; owners also see inactive |
| `working_hours` | SELECT active | Full CRUD |
| `blocked_times` | — | Full CRUD |
| `appointments` | INSERT `pending` only | SELECT/INSERT/UPDATE/DELETE |
| `portfolio_items` | SELECT visible | Full CRUD |

Cross-business access is denied by policies that key off `is_business_owner`. Frontend filtering is never the security boundary.

## Double booking

`appointments_no_overlap` is a GiST **exclusion constraint** on `(business_id, tstzrange(start_at, end_at))` for rows with `status IN ('pending', 'confirmed')`. Concurrent inserts that overlap fail at the database.

Triggers also enforce: service belongs to business, `end_at = start_at + duration`, public can only book active services as `pending`.

## Storage (`portfolio` bucket)

Path convention (enforced by policies):

```text
businesses/{business_id}/portfolio/{filename}
```

- Bucket is **public** for read (gallery URLs).
- INSERT/UPDATE/DELETE only if `is_business_owner(portfolio_object_business_id(name))`.
- Allowed MIME types: jpeg, png, webp, gif; max 10 MiB.

Store `image_path` on `portfolio_items` as the object path (or full public URL — pick one convention in the admin upload feature).

## Regenerate TypeScript types

Hand-maintained types live in `src/types/database.ts`. After schema changes, prefer regenerating from the linked project:

```bash
npx supabase gen types typescript --project-id <ref> > src/types/database.ts
```

Or with local Supabase:

```bash
npx supabase gen types typescript --local > src/types/database.ts
```

## Auth note for later phases

`handle_new_user` creates a `profiles` row on `auth.users` insert. Admin route protection (middleware / server checks) is Phase 3+.
