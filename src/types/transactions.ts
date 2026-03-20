export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  type: TransactionType;
  description: string | null;
  created_at: string;
}

export interface TransactionFormValues {
  amount: string;
  category: string;
  description: string;
  date: string;
  type: TransactionType;
}

export interface TransactionMutationInput {
  amount: number;
  category: string;
  description: string | null;
  created_at: string;
  type: TransactionType;
  user_id: string;
}

export interface TransactionFilters {
  selectedPeriod: string;
  typeFilter: "all" | TransactionType;
  categoryFilter: string;
  sortOrder: "date-desc" | "date-asc" | "amount-desc" | "amount-asc";
  searchQuery: string;
  minAmount: string;
  maxAmount: string;
  customStartDate: string;
  customEndDate: string;
}

export interface SalaryPeriod {
  id: string;
  label: string;
  start: Date;
  end: Date | null;
  type: "salary";
}
