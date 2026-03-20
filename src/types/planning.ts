import type { TransactionType } from "@/types/transactions";

export interface BudgetCategory {
  id: string;
  user_id: string | null;
  name: string;
  type: TransactionType;
  created_at?: string;
  isDefault?: boolean;
}

export interface BudgetGoal {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  month_key: string;
  created_at: string;
}

export interface BudgetProgressItem {
  category: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  progress: number;
  isOverBudget: boolean;
}
