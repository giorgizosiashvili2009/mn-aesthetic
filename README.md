# MN Aesthetic + Supabase

This version uses Supabase for customer accounts and appointment data. There is no local SQLite database and no Express backend.

## 1. Install

Open the project in VS Code and run:

```bash
npm install
```

## 2. Create a Supabase project

Create a project at Supabase.

Then open:

Supabase Dashboard -> SQL Editor -> New query

Copy everything from:

```text
supabase/schema.sql
```

Paste it into the SQL editor and run it.

## 3. Get your Supabase keys

In Supabase:

Project Settings -> API

Copy:
- Project URL
- Publishable key (or anon key if your dashboard shows that instead)

Create a file named `.env` in the project root:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Do not put the service_role/secret key in this project.

## 4. Email confirmation

Supabase can require users to confirm their email address.

For simple local testing, you can disable email confirmation in:

Authentication -> Providers -> Email

For a real business website, keeping email confirmation enabled is generally better.

## 5. Run

```bash
npm run dev
```

Open:

http://localhost:5173

## What is stored in Supabase

Customer accounts are handled by Supabase Auth.

Appointments are stored in the `appointments` table.

Services are stored in the `services` table.

Row Level Security is enabled so customers can only read their own appointments.

## Important

The public/publishable/anon key is designed to be used by the browser when RLS is configured correctly.

Never put a Supabase service_role or secret key into the React frontend.
