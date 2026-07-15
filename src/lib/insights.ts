import { getMonthKey, getPreviousMonthKey } from "@/lib/planning";
import { roundMoney } from "@/lib/transactions";
import type { Transaction } from "@/types/transactions";

export interface MetricDelta {
  current: number;
  previous: number;
  change: number;
  /** Percent change vs the previous month; null when the previous value is 0. */
  changePct: number | null;
}

export interface CategoryDelta extends MetricDelta {
  category: string;
}

export interface MonthComparison {
  currentMonthKey: string;
  previousMonthKey: string;
  income: MetricDelta;
  expenses: MetricDelta;
  net: MetricDelta;
  /** Expense categories that moved the most (by absolute change), largest first. */
  topMovers: CategoryDelta[];
}

const percentChange = (current: number, previous: number): number | null =>
  previous === 0 ? null : roundMoney(((current - previous) / previous) * 100);

const toDelta = (current: number, previous: number): MetricDelta => ({
  current: roundMoney(current),
  previous: roundMoney(previous),
  change: roundMoney(current - previous),
  changePct: percentChange(current, previous),
});

/**
 * Compares the current month against the previous one for income, expenses, net,
 * and per-expense-category movement. Month attribution uses UTC keys, consistent
 * with how transaction dates are stored (see the budgetflow-conventions skill).
 */
export const buildMonthComparison = (
  transactions: Transaction[],
  currentMonthKey: string = getMonthKey(),
): MonthComparison => {
  const previousMonthKey = getPreviousMonthKey(currentMonthKey);

  const totals = { curIncome: 0, prevIncome: 0, curExpense: 0, prevExpense: 0 };
  const byCategory = new Map<string, { current: number; previous: number }>();

  transactions.forEach((transaction) => {
    const key = getMonthKey(transaction.created_at);
    if (key !== currentMonthKey && key !== previousMonthKey) {
      return;
    }
    const isCurrent = key === currentMonthKey;

    if (transaction.type === "income") {
      if (isCurrent) totals.curIncome += transaction.amount;
      else totals.prevIncome += transaction.amount;
      return;
    }

    if (isCurrent) totals.curExpense += transaction.amount;
    else totals.prevExpense += transaction.amount;

    const entry = byCategory.get(transaction.category) ?? { current: 0, previous: 0 };
    if (isCurrent) entry.current += transaction.amount;
    else entry.previous += transaction.amount;
    byCategory.set(transaction.category, entry);
  });

  const topMovers: CategoryDelta[] = Array.from(byCategory.entries())
    .map(([category, { current, previous }]) => ({ category, ...toDelta(current, previous) }))
    .filter((delta) => delta.change !== 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  return {
    currentMonthKey,
    previousMonthKey,
    income: toDelta(totals.curIncome, totals.prevIncome),
    expenses: toDelta(totals.curExpense, totals.prevExpense),
    net: toDelta(totals.curIncome - totals.curExpense, totals.prevIncome - totals.prevExpense),
    topMovers,
  };
};
