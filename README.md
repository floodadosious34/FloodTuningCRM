# Piano Tuning CRM

A mobile-first web app for a self-employed piano technician to manage clients, instruments, and service records.

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run the database schema

In the Supabase SQL editor, paste and run the contents of [`supabase/schema.sql`](supabase/schema.sql).

### 3. Configure environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Find your project URL and anon key in **Supabase → Project Settings → API**.

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. Create your user account

In **Supabase → Authentication → Users**, click "Add user" and create your account with email/password.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add the two env vars (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy

## Features

- **Dashboard** — clients due for service (last service > 11 months ago), stats at a glance
- **Client list** — searchable, tap to view details
- **Client detail** — contact info, all pianos, full service history per piano
- **Reminder queue** — one-tap copy of a pre-written SMS template, "Mark Reminded" button
- **Add/edit/delete** — clients, pianos, and service records
- **Auth** — email/password login, single-user
