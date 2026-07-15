import type {
  Transaction,
  TransactionFormValues,
  TransactionMutationInput,
  TransactionType,
} from "@/types/transactions";

export const DEFAULT_TRANSACTION_CATEGORIES: Record<TransactionType, string[]> = {
  expense: ["housing", "food", "transport", "entertainment", "utilities", "shopping", "health", "other"],
  income: ["salary", "freelance", "investments", "gifts", "other"],
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
  merchant: transaction.merchant ?? "",
  receiptPath: transaction.receipt_path ?? "",
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
  merchant: values.merchant.trim() || null,
  receipt_path: values.receiptPath || null,
  created_at: new Date(`${values.date}T12:00:00.000Z`).toISOString(),
  type: values.type,
  user_id: userId,
});

export const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

/**
 * Round a monetary value to whole cents, avoiding binary-float drift from naive
 * accumulation (e.g. 0.1 + 0.2). Apply at aggregation boundaries — never compare
 * raw summed floats. See the `budgetflow-conventions` skill.
 */
export const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

export const normalizeCategoryName = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

export const formatCategoryLabel = (value?: string | null) => {
  if (!value || typeof value !== "string") {
    return "Uncategorized";
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return "Uncategorized";
  }

  return normalizedValue
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};
