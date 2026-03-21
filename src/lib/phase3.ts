import { addMonths, addWeeks, differenceInCalendarDays, format } from "date-fns";
import { DEFAULT_USER_PREFERENCES, formatMoneyWithPreferences } from "@/lib/preferences";
import { isMissingRelationError } from "@/lib/planning";
import { formatCategoryLabel } from "@/lib/transactions";
import type { BudgetProgressItem } from "@/types/planning";
import type { RecurringFrequency, RecurringTransaction, SavingsGoal, SavingsGoalProgress, SmartAlert } from "@/types/phase3";
import type { UserPreferences } from "@/types/preferences";
import type { Transaction } from "@/types/transactions";

type NumericLike = number | string;

type RecurringRow = Omit<RecurringTransaction, "amount"> & {
  amount: NumericLike;
};

type SavingsRow = Omit<SavingsGoal, "target_amount" | "current_amount"> & {
  target_amount: NumericLike;
  current_amount: NumericLike;
};

export const normalizeRecurringTransaction = (row: RecurringRow): RecurringTransaction => ({
  ...row,
  amount: Number(row.amount),
});

export const normalizeSavingsGoal = (row: SavingsRow): SavingsGoal => ({
  ...row,
  target_amount: Number(row.target_amount),
  current_amount: Number(row.current_amount),
});

export const getNextOccurrence = (startDate: string, frequency: RecurringFrequency, now = new Date()) => {
  let nextDate = new Date(`${startDate}T12:00:00.000Z`);
  const comparisonDate = new Date(now);

  while (nextDate < comparisonDate) {
    nextDate = frequency === "weekly" ? addWeeks(nextDate, 1) : addMonths(nextDate, 1);
  }

  return nextDate.toISOString();
};

export const buildSavingsProgress = (goals: SavingsGoal[]): SavingsGoalProgress[] =>
  goals
    .map((goal) => {
      const remainingAmount = goal.target_amount - goal.current_amount;
      const progress = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;

      return {
        id: goal.id,
        name: goal.name,
        targetAmount: goal.target_amount,
        currentAmount: goal.current_amount,
        remainingAmount,
        progress,
        targetDate: goal.target_date,
        isCompleted: goal.current_amount >= goal.target_amount,
      };
    })
    .sort((firstGoal, secondGoal) => secondGoal.progress - firstGoal.progress);

export const buildSmartAlerts = ({
  budgetProgress,
  recurringTransactions,
  savingsGoals,
  transactions,
  preferences = DEFAULT_USER_PREFERENCES,
  now = new Date(),
}: {
  budgetProgress: BudgetProgressItem[];
  recurringTransactions: RecurringTransaction[];
  savingsGoals: SavingsGoalProgress[];
  transactions: Transaction[];
  preferences?: Pick<
    UserPreferences,
    "preferred_currency" | "locale" | "budget_alerts_enabled" | "recurring_alerts_enabled" | "savings_alerts_enabled"
  >;
  now?: Date;
}): SmartAlert[] => {
  const alerts: SmartAlert[] = [];

  if (preferences.budget_alerts_enabled) {
    budgetProgress
      .filter((item) => item.isOverBudget)
      .slice(0, 2)
      .forEach((item) => {
        alerts.push({
          id: `budget-${item.category}`,
          tone: "warning",
          title: `${formatCategoryLabel(item.category)} is over budget`,
          description: `You are ${formatMoneyWithPreferences(Math.abs(item.remaining), preferences)} over your monthly limit.`,
        });
      });
  }

  if (preferences.recurring_alerts_enabled) {
    recurringTransactions
      .filter((item) => item.is_active)
      .filter((item) => differenceInCalendarDays(new Date(item.next_occurrence), now) <= 7)
      .slice(0, 2)
      .forEach((item) => {
        alerts.push({
          id: `recurring-${item.id}`,
          tone: "info",
          title: `${item.title} is due soon`,
          description: `${format(new Date(item.next_occurrence), "MMM d")} | ${item.type === "expense" ? "-" : "+"}${formatMoneyWithPreferences(item.amount, preferences)}`,
        });
      });
  }

  if (preferences.savings_alerts_enabled) {
    savingsGoals
      .filter((goal) => !goal.isCompleted)
      .slice(0, 1)
      .forEach((goal) => {
        alerts.push({
          id: `savings-${goal.id}`,
          tone: "success",
          title: `${goal.name} is ${goal.progress.toFixed(0)}% funded`,
          description: `${formatMoneyWithPreferences(goal.remainingAmount, preferences)} left to reach your goal.`,
        });
      });
  }

  if (alerts.length === 0 && transactions.length > 0) {
    alerts.push({
      id: "steady",
      tone: "success",
      title: "Your finances look steady",
      description: "No urgent budget or recurring alerts right now.",
    });
  }

  return alerts;
};

export const getRelationSetupError = (error: unknown, tableName: string, setupFile: string) => {
  if (isMissingRelationError(error)) {
    return new Error(`The ${tableName} table is not set up yet. Run ${setupFile} first.`);
  }

  return error;
};
