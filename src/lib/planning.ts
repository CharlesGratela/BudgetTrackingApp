import { format, subMonths } from "date-fns";
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

type BudgetGoalRow = Omit<BudgetGoal, "monthly_limit" | "rollover_enabled"> & {
  monthly_limit: number | string;
  rollover_enabled?: boolean | null;
};

export const normalizeBudgetGoal = (row: BudgetGoalRow): BudgetGoal => ({
  ...row,
  monthly_limit: Number(row.monthly_limit),
  rollover_enabled: Boolean(row.rollover_enabled),
});

export const getMonthKey = (date = new Date()) => format(date, "yyyy-MM");

export const getPreviousMonthKey = (monthKey: string) => {
  const parsedDate = new Date(`${monthKey}-01T12:00:00.000Z`);
  return format(subMonths(parsedDate, 1), "yyyy-MM");
};

export const buildBudgetProgress = (
  goals: BudgetGoal[],
  transactions: Transaction[],
  monthKey: string,
  previousGoals: BudgetGoal[] = [],
): BudgetProgressItem[] => {
  const previousMonthKey = getPreviousMonthKey(monthKey);
  const spendByCategory = transactions
    .filter((transaction) => transaction.type === "expense")
    .filter((transaction) => format(new Date(transaction.created_at), "yyyy-MM") === monthKey)
    .reduce<Record<string, number>>((accumulator, transaction) => {
      accumulator[transaction.category] = (accumulator[transaction.category] || 0) + transaction.amount;
      return accumulator;
    }, {});

  const previousSpendByCategory = transactions
    .filter((transaction) => transaction.type === "expense")
    .filter((transaction) => format(new Date(transaction.created_at), "yyyy-MM") === previousMonthKey)
    .reduce<Record<string, number>>((accumulator, transaction) => {
      accumulator[transaction.category] = (accumulator[transaction.category] || 0) + transaction.amount;
      return accumulator;
    }, {});

  return goals
    .map((goal) => {
      const matchingPreviousGoal = previousGoals.find((item) => item.category === goal.category);
      const previousRemaining = matchingPreviousGoal
        ? matchingPreviousGoal.monthly_limit - (previousSpendByCategory[goal.category] || 0)
        : 0;
      const carriedOver =
        matchingPreviousGoal?.rollover_enabled && previousRemaining > 0 ? previousRemaining : 0;
      const spent = spendByCategory[goal.category] || 0;
      const effectiveLimit = goal.monthly_limit + carriedOver;
      const remaining = effectiveLimit - spent;
      const progress = effectiveLimit > 0 ? Math.min((spent / effectiveLimit) * 100, 100) : 0;

      return {
        category: goal.category,
        baseMonthlyLimit: goal.monthly_limit,
        carriedOver,
        monthlyLimit: effectiveLimit,
        spent,
        remaining,
        progress,
        isOverBudget: spent > effectiveLimit,
        rolloverEnabled: goal.rollover_enabled,
      };
    })
    .sort((a, b) => b.progress - a.progress);
};
