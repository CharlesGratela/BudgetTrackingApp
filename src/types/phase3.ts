import type { TransactionType } from "@/types/transactions";

export type RecurringFrequency = "weekly" | "monthly";

export interface RecurringTransaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  type: TransactionType;
  description: string | null;
  frequency: RecurringFrequency;
  start_date: string;
  next_occurrence: string;
  is_active: boolean;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  created_at: string;
}

export interface SavingsGoalProgress {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  progress: number;
  targetDate: string | null;
  isCompleted: boolean;
}

export interface SmartAlert {
  id: string;
  tone: "info" | "warning" | "success";
  title: string;
  description: string;
}
