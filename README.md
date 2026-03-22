# BudgetFlow

BudgetFlow is a mobile-first personal finance tracking application built with React, TypeScript, and Supabase. It helps users track income and expenses, manage category budgets, monitor savings goals, review analytics, and personalize how the app behaves.

## Current App Setup

The current app includes:

- public landing page
- email/password authentication with Supabase
- email-confirmation-based registration
- mobile-first dashboard overview
- analytics page with charts and filters
- add and edit transaction flows
- custom categories
- monthly budget goals
- budget rollover
- recurring transactions
- savings goals
- user preferences and alert settings

## Features

### Authentication

- Supabase email/password sign in
- Supabase email/password sign up
- sign-up stores `full_name` in auth user metadata
- sign-up expects email confirmation before normal login
- default landing page after sign-in can be personalized through user preferences

Note:

- Passwordless OTP is not yet active in the current UI

### Dashboard Overview

- mobile-first daily-use dashboard
- total balance and monthly summary cards
- smart alerts
- budget snapshot
- savings goals progress
- upcoming recurring transactions
- recent transactions preview

### Analytics

- income vs expense trend chart
- expense distribution chart
- total comparison chart
- CSV export
- advanced filtering by:
  - period
  - salary period
  - type
  - category
  - text search
  - amount range
  - custom date range

### Transaction Management

- add income and expense transactions
- edit existing transactions
- delete transactions
- category-aware transaction form

### Budgeting

- custom categories
- monthly budget goals by category
- optional budget rollover per category

### Planning

- recurring transactions for bills, subscriptions, and income
- savings goals with current progress tracking

### Preferences

- preferred currency
- locale / date formatting
- payday frequency
- default landing page
- budget alert preference
- recurring alert preference
- savings alert preference

### UI / UX

- mobile-first layout
- dark mode support
- responsive navigation
- reusable dialogs and shadcn/ui components

## Tech Stack

- React 18
- TypeScript
- Vite
- Supabase
- Tailwind CSS
- shadcn/ui
- Radix UI
- React Query
- Recharts
- Framer Motion
- React Router
- Vitest

## Routes

Current main routes:

- `/` - landing page
- `/login` - sign in / sign up page
- `/dashboard` - mobile-first dashboard overview
- `/analytics` - deeper reporting and filtering screen
- `/add-transaction` - add transaction form
- `/transactions/:transactionId/edit` - edit transaction form

## Local Development

### Prerequisites

- Node.js 18+
- npm
- a Supabase project

### Installation

1. Clone the repository

```sh
git clone https://github.com/YOUR_USERNAME/budget-tracking-app.git
cd budget-tracking-app
```

2. Install dependencies

```sh
npm install
```

3. Create a `.env` file

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server

```sh
npm run dev
```

## Supabase Setup

The current app setup is split into phases. Run these SQL files in order inside your Supabase SQL editor.

### Base Transactions Table

You need the `transactions` table:

```sql
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount numeric not null,
  category text not null,
  type text not null check (type in ('income', 'expense')),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table transactions enable row level security;

drop policy if exists "Users can view their own transactions" on transactions;
create policy "Users can view their own transactions"
on transactions for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own transactions" on transactions;
create policy "Users can insert their own transactions"
on transactions for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own transactions" on transactions;
create policy "Users can update their own transactions"
on transactions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own transactions" on transactions;
create policy "Users can delete their own transactions"
on transactions for delete
using (auth.uid() = user_id);
```

### Additional SQL Files

Then run:

- [supabase_phase2_setup.sql](./supabase_phase2_setup.sql)
- [supabase_phase3_setup.sql](./supabase_phase3_setup.sql)
- [supabase_phase4_setup.sql](./supabase_phase4_setup.sql)

These add support for:

- categories
- budget goals
- recurring transactions
- savings goals
- user preferences
- budget rollover

## Scripts

```sh
npm run dev
npm run build
npm run preview
npm run lint
npm run test
```

## Testing and Verification

The project uses:

- `Vitest` for tests
- `ESLint` for linting
- `Vite build` for production verification

Typical verification flow:

```sh
npm run test
npm run build
npm run lint
```

## Supporting Project Files

Useful repo documentation:

- [PROJECT_ANALYSIS_AND_FEATURE_ROADMAP.md](./PROJECT_ANALYSIS_AND_FEATURE_ROADMAP.md)
- [chat-history.md](./chat-history.md)

Promo/demo helper files:

- [LINKEDIN_VIDEO_CAPTIONS.txt](./LINKEDIN_VIDEO_CAPTIONS.txt)
- [LINKEDIN_VIDEO_CAPTIONS.srt](./LINKEDIN_VIDEO_CAPTIONS.srt)

## Deployment

This project is configured for deployment on Vercel.

Basic deployment flow:

1. push the repository to GitHub
2. import the project into Vercel
3. add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. deploy

## Current Notes

- the app is now centered around a mobile-first dashboard experience
- analytics remains the deeper reporting screen
- README now reflects the current implemented setup rather than the earlier MVP description

## License

This project is open-source and available under the MIT License.
