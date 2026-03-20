import type {
  Transaction,
  TransactionFormValues,
  TransactionMutationInput,
  TransactionType,
} from "@/types/transactions";

export const DEFAULT_TRANSACTION_CATEGORIES: Record<TransactionType, string[]> = {
  expense: ["Housing", "Food", "Transport", "Entertainment", "Utilities", "Shopping", "Health", "Other"],
  income: ["Salary", "Freelance", "Investments", "Gifts", "Other"],
};

type TransactionRow = Omit<Transaction, "amount"> & {
  amount: number | string;
};

export const normalizeTransaction = (row: TransactionRow): Transaction => ({
  ...row,
  amount: Number(row.amount),
});

export const transactionToFormValues = (transaction: Transaction): TransactionFormValues => ({
  amount: transaction.amount.toString(),
  category: transaction.category,
  description: transaction.description ?? "",
  date: transaction.created_at.split("T")[0],
  type: transaction.type,
});

export const buildTransactionPayload = (
  values: TransactionFormValues,
  userId: string,
): TransactionMutationInput => ({
  amount: Number(values.amount),
  category: values.category,
  description: values.description.trim() || null,
  created_at: new Date(values.date).toISOString(),
  type: values.type,
  user_id: userId,
});

export const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
