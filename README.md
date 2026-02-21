# BudgetFlow - Personal Finance Tracker

BudgetFlow is a modern, fast, and secure personal finance tracking application built with React, TypeScript, and Supabase. It helps users monitor their income and expenses, visualize spending habits, and stay on top of their financial goals.

![BudgetFlow Dashboard Preview](https://via.placeholder.com/800x400?text=BudgetFlow+Dashboard)

## 🚀 Features

- **Secure Authentication:** Passwordless OTP and standard email/password login powered by Supabase Auth.
- **Dashboard Analytics:** Interactive charts (Area, Pie, Bar) using Recharts to visualize income vs. expenses.
- **Smart Insights:** Automatically calculates and highlights your top spending categories for the selected period.
- **Advanced Filtering:** Filter transactions by custom date ranges, salary periods, categories, and types.
- **Data Export:** Download your filtered transaction history directly to a CSV file for Excel or Google Sheets.
- **Transaction Management:** Add, view, and delete transactions with detailed descriptions.
- **Responsive Design:** Fully mobile-optimized UI built with Tailwind CSS and shadcn/ui.
- **Dark Mode:** Built-in theme toggling for comfortable viewing at night.

## 🛠️ Tech Stack

- **Frontend Framework:** [React 18](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Charts:** [Recharts](https://recharts.org/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Routing:** [React Router v6](https://reactrouter.com/)
- **Deployment:** [Vercel](https://vercel.com/)

## 💻 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/YOUR_USERNAME/budget-tracking-app.git
   cd budget-tracking-app
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup (Supabase SQL Editor):**
   You will need a `transactions` table. Run this in your Supabase SQL editor:
   ```sql
   create table transactions (
     id uuid default gen_random_uuid() primary key,
     user_id uuid references auth.users not null,
     amount numeric not null,
     category text not null,
     type text not null check (type in ('income', 'expense')),
     description text,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Enable Row Level Security (RLS)
   alter table transactions enable row level security;

   -- Create policies
   create policy "Users can view their own transactions" on transactions for select using (auth.uid() = user_id);
   create policy "Users can insert their own transactions" on transactions for insert with check (auth.uid() = user_id);
   create policy "Users can delete their own transactions" on transactions for delete using (auth.uid() = user_id);
   ```

5. **Start the development server:**
   ```sh
   npm run dev
   ```

## 🌐 Deployment

This project is configured for easy deployment on Vercel. 
1. Push your code to GitHub.
2. Import the repository into Vercel.
3. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Vercel Environment Variables settings.
4. Deploy!

## 📝 License

This project is open-source and available under the MIT License.
