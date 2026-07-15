# Project Analysis and Feature Roadmap

## Purpose

This document tracks the current state of the repository, the main technical findings from code analysis, and the recommended feature roadmap for the BudgetFlow application.

It should be treated as a living document and updated as features are implemented or priorities change.

## Project Snapshot

- Project name: `BudgetFlow`
- Stack: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Supabase, Recharts
- Current app shape:
  - Public landing page
  - Login and sign-up flow
  - Add transaction form
  - Analytics dashboard
  - Shared navbar/theme system

## Current Implemented Features

- User authentication with Supabase email/password auth
- Landing page with product marketing content
- Add income and expense transactions
- Transaction listing on analytics page
- Delete transaction capability
- Summary cards for income, expenses, savings, and balance
- Analytics charts:
  - Income vs expense trend
  - Expense distribution
  - Total comparison
- Filters for:
  - Preset periods
  - Salary periods
  - Type
  - Category
  - Sort order
- CSV export for filtered transactions
- Responsive layout and dark mode support

## Key Repository Findings

### Strengths

- The application already has a clear product direction and usable MVP flow.
- UI quality is strong for the current stage of the project.
- The design system and theme tokens are already in place, which will make future features easier to implement consistently.
- The analytics page already provides real value and is the strongest product screen today.
- Mobile responsiveness is already considered in key flows.

### Main Gaps

- The README currently describes some capabilities that are not fully implemented yet.
  - It mentions OTP/passwordless auth, but the app currently uses email/password auth.
  - It mentions custom date range filtering, but the app currently supports preset date filters and salary-based periods.
- Transaction editing is not implemented yet, although the UI already suggests it.
- Categories are hardcoded in the frontend instead of being user-managed in the database.
- Type safety is weak in important areas, especially the analytics screen where transactions use `any[]`.
- React Query is installed and provided globally, but it is not being used for app data fetching or mutations yet.
- The analytics page has grown too large and is handling too many concerns in a single file.
- Automated tests are nearly nonexistent.
- Some encoding issues are visible in UI and documentation text.
- The production bundle is relatively large and could benefit from code-splitting.

## Technical Debt and Cleanup Items

### High Priority

- Add proper shared TypeScript types for transactions and Supabase database entities
- Replace `any[]` transaction state with typed models
- Refactor analytics logic into smaller components and hooks
- Implement React Query for transaction fetching, mutation, and cache invalidation
- Align the README with actual implementation or implement the missing features it claims
- Add tests for core flows:
  - auth access control
  - add transaction
  - delete transaction
  - analytics calculations

### Medium Priority

- Fix encoding issues in source files and documentation
- Move hardcoded categories into database-backed user-configurable categories
- Improve auth/session handling consistency across pages
- Add better empty, loading, and error states around data operations

### Low Priority

- Reduce bundle size using route-based code splitting
- Clean up unused or placeholder files
- Revisit lint warnings from generated/shadcn-style files if desired

## Suggested Feature Roadmap

## 1. Edit Transaction

### Why it matters

- This completes the basic CRUD workflow.
- The UI already hints that this feature should exist.
- It has high user value and relatively low product risk.

### Scope

- Open transaction in editable form
- Update amount, category, date, type, and description
- Persist changes to Supabase
- Refresh dashboard data after update

## 2. Budget Goals by Category

### Why it matters

- This makes the app a true budget tracker instead of only a transaction logger.
- It naturally extends the existing analytics experience.

### Scope

- Users define monthly spending limits per category
- Dashboard shows target vs actual
- Visual progress indicators
- Highlight overspending categories

## 3. Custom Categories

### Why it matters

- Hardcoded categories will quickly become limiting.
- User-managed categories improve flexibility and personalization.

### Scope

- Add category table in Supabase
- Create category management UI
- Replace frontend constant categories
- Filter analytics using user categories

## 4. Recurring Transactions

### Why it matters

- Recurring salary and recurring bills are a natural fit for this product.
- This reduces manual data entry and improves realism of the budgeting flow.

### Scope

- Define recurring rules
- Auto-create scheduled transactions
- Support recurring income and recurring expenses

## 5. Dashboard Overview Page

### Why it matters

- Right now analytics acts as the main app page.
- A dedicated overview screen would create better separation between daily use and deeper analysis.

### Scope

- Balance overview
- Recent transactions
- Budget alerts
- Savings progress
- Quick actions

## 6. Advanced Search and Filters

### Why it matters

- The current filter bar is a strong start but still limited for real-world use.
- Power users will want more precise filtering.

### Scope

- Free-text search
- Custom date range
- Amount range
- Multi-category selection
- Possibly merchant/payee filtering later

## 7. Savings Goals / Sinking Funds

### Why it matters

- This adds motivational value and long-term planning support.
- It aligns with the product messaging around growth and better financial habits.

### Scope

- Create savings goals
- Track current progress
- Show target date / target amount
- Include dashboard widgets and analytics tie-ins

## 8. Monthly Budget Rollover

### Why it matters

- This is a more advanced budgeting behavior that makes the product feel more mature.

### Scope

- Carry unused category budget to the next cycle
- Support enabling rollover per category

## 9. Account and Profile Settings

### Why it matters

- This centralizes preferences and makes the app feel more complete.

### Scope

- Profile details
- Preferred currency
- Timezone
- Default categories
- Budget preferences

## 10. Smart Insights and Alerts

### Why it matters

- The app already has a basic insight pattern.
- Expanding it would create a more proactive product experience.

### Scope

- Overspending alerts
- Month-over-month comparison insights
- Subscription reminders
- Payday summaries

## Recommended Implementation Order

### Phase 1: Strong Foundation + Immediate UX Value

- Edit transaction
- Shared transaction types
- React Query adoption
- Analytics refactor
- Better tests

### Phase 2: Core Budgeting Features

- Budget goals by category
- Custom categories
- Advanced filters
- Dashboard overview

### Phase 3: Product Maturity Features

- Recurring transactions
- Savings goals
- Smart insights and alerts
- Budget rollover
- Settings/profile enhancements

### Phase 4: Future Considerations

- Dedicated dashboard refinement and home-screen polish
- Automatic recurring transaction generation
- Merchant / payee field for transactions
- Savings goal contribution history
- Month-over-month financial insights
- Smarter budgeting behavior and rollover improvements
- Expanded profile and preferences
- Better export and backup options
- Receipt / attachment support
- Shared or household budgeting

## Phase 4 Suggestions

These were identified as strong next-step opportunities after the current implemented phases.

### 1. Automatic Recurring Transaction Generation

#### Why it matters

- Recurring templates already exist
- The next high-value step is generating actual transactions automatically
- This reduces manual tracking effort

#### Scope

- Generate transactions from recurring templates
- Support weekly and monthly schedules
- Avoid duplicate generation
- Optionally implement via Supabase Edge Functions or scheduled jobs

### 2. Merchant / Payee Tracking

#### Why it matters

- Real-world budgeting often depends on who the money was spent with
- It improves search, analytics, and insight quality

#### Scope

- Add merchant or payee field to transactions
- Support filtering by merchant
- Use merchant data in analytics and summaries

### 3. Savings Goal Contributions

#### Why it matters

- Current savings goals track totals directly
- Contribution history would make savings progress more transparent and auditable

#### Scope

- Add contribution records per savings goal
- Show contribution history
- Calculate progress from contributions instead of only direct totals

### 4. Month-over-Month Insights

#### Why it matters

- The app already supports alerts and analytics
- Comparing one period to another would make insights more actionable

#### Scope

- Spending increase / decrease by category
- Income comparisons across months or salary periods
- Budget adherence summaries

### 5. Better Export and Backup Options

#### Why it matters

- CSV export is already useful
- More export options would improve portability and reporting

#### Scope

- PDF summaries
- Monthly reports
- JSON backup / restore

### 6. Transaction Attachments

#### Why it matters

- Receipts and proof of payment are useful for expense tracking
- This increases real-world practicality

#### Scope

- Upload receipt images using Supabase Storage
- Attach files to transactions
- View receipts from transaction history

### 7. Shared / Household Budgets

#### Why it matters

- This would expand the app from solo budgeting to collaborative use cases
- It introduces a higher-value multi-user product direction

#### Scope

- Invite another user
- Shared categories and goals
- Household-level dashboard and summaries

## Verification Notes

The following checks were run during repository analysis:

- `npm run build`
  - Passed
  - Warning about CSS `@import` order
  - Warning about large bundle size
- `npm run lint`
  - Passed with warnings
  - Warnings were mostly Fast Refresh export warnings in component files
- `npm run test`
  - Passed
  - Only placeholder test coverage currently exists

## Recommended Next Step

If we want the best mix of product impact and implementation simplicity, the next feature to build should be:

- `Edit Transaction`

After that, the highest-value strategic feature is:

- `Budget Goals by Category`

## Status Tracker

### Planned

- Edit transaction
- Budget goals by category
- Custom categories
- Recurring transactions
- Dashboard overview page
- Advanced search and filters
- Savings goals
- Monthly budget rollover
- Account and profile settings
- Smart insights and alerts
- Automatic recurring transaction generation
- Merchant / payee tracking
- Savings goal contribution history
- Month-over-month insights
- Better export and backup options
- Transaction attachments
- Shared / household budgets

### In Progress

- (none)

### Completed

- Repository analysis completed
- Initial feature roadmap documented
- Shared transaction types added
- React Query transaction hooks added
- Reusable transaction form added
- Edit transaction flow implemented
- Analytics refactored to use shared transaction utilities and query hooks
- Analytics helper tests added
- Phase 2 Supabase setup SQL added
- Mobile-first dashboard overview page implemented
- Budget rollover added to monthly budget goals
- Profile and preferences added
- Budget goals by category
- Custom categories
- Advanced search and filters
- Phase 3 Supabase setup SQL added
- Recurring transactions
- Savings goals
- Smart insights and alerts

### Correctness & Hardening Pass (2026-07)

- Currency display now respects the user's preferred currency everywhere (shared `useFormatters` hook)
- Fixed the duplicate "Savings" summary card (now a distinct savings-rate metric)
- Standardized date handling on UTC (noon-UTC storage anchor, UTC month keys, year-aware daily chart, UTC custom-range boundaries, inclusive period edges)
- Rounded monetary aggregations to cents to avoid float drift (`roundMoney` helper)
- Hardened `getNextOccurrence` against malformed dates and bounded its loop
- Closed the CSV formula-injection hole in export
- Made budget-goal writes atomic via a Postgres RPC (`supabase_phase5_setup.sql`) with a safe fallback; added a `transactions(user_id, created_at)` index
- Tightened missing-table detection to error codes only (stopped swallowing real errors)
- Enabled `strictNullChecks` and added a `typecheck` script
- Grew regression tests from 12 to 25; added project skills (`budgetflow-conventions`, `add-supabase-feature`, `write-tests`)
- Cleanup: removed dead `Index.tsx` and `bun.lockb`, fixed `index.html` metadata/typos, repaired `.gitignore`
