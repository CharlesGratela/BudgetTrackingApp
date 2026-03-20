import { format } from "date-fns";
import { DEFAULT_TRANSACTION_CATEGORIES, normalizeCategoryName } from "@/lib/transactions";
import type { BudgetCategory, BudgetGoal, BudgetProgressItem } from "@/types/planning";
import type { Transaction, TransactionType } from "@/types/transactions";

export const isMissingRelationError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = "message" in error ? String(error.message) : "";
  const code = "code" in error ? String(error.code) : "";

  return code === "42P01" || code === "PGRST205" || message.toLowerCase().includes("relation") || message.toLowerCase().includes("categories");
};

export const getDefaultCategories = (type?: TransactionType): BudgetCategory[] => {
  const categoryTypes = type ? [type] : (["expense", "income"] as const);

  return categoryTypes.flatMap((categoryType) =>
    DEFAULT_TRANSACTION_CATEGORIES[categoryType].map((name) => ({
      id: `default-${categoryType}-${name}`,
      user_id: null,
      name,
      type: categoryType,
      isDefault: true,
    })),
  );
};

export const mergeCategories = (categories: BudgetCategory[], type?: TransactionType) => {
  const merged = [...getDefaultCategories(type), ...categories];
  const unique = new Map<string, BudgetCategory>();

  merged.forEach((category) => {
    unique.set(`${category.type}:${normalizeCategoryName(category.name)}`, {
      ...category,
      name: normalizeCategoryName(category.name),
    });
  });

  return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
};

type BudgetGoalRow = Omit<BudgetGoal, "monthly_limit"> & {
  monthly_limit: number | string;
};

export const normalizeBudgetGoal = (row: BudgetGoalRow): BudgetGoal => ({
  ...row,
  monthly_limit: Number(row.monthly_limit),
});

export const getMonthKey = (date = new Date()) => format(date, "yyyy-MM");

export const buildBudgetProgress = (
  goals: BudgetGoal[],
  transactions: Transaction[],
  monthKey: string,
): BudgetProgressItem[] => {
  const spendByCategory = transactions
    .filter((transaction) => transaction.type === "expense")
    .filter((transaction) => format(new Date(transaction.created_at), "yyyy-MM") === monthKey)
    .reduce<Record<string, number>>((accumulator, transaction) => {
      accumulator[transaction.category] = (accumulator[transaction.category] || 0) + transaction.amount;
      return accumulator;
    }, {});

  return goals
    .map((goal) => {
      const spent = spendByCategory[goal.category] || 0;
      const remaining = goal.monthly_limit - spent;
      const progress = goal.monthly_limit > 0 ? Math.min((spent / goal.monthly_limit) * 100, 100) : 0;

      return {
        category: goal.category,
        monthlyLimit: goal.monthly_limit,
        spent,
        remaining,
        progress,
        isOverBudget: spent > goal.monthly_limit,
      };
    })
    .sort((a, b) => b.progress - a.progress);
};
