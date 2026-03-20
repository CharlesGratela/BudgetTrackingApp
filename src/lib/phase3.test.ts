import { buildSavingsProgress, buildSmartAlerts, getNextOccurrence } from "@/lib/phase3";
import type { BudgetProgressItem } from "@/types/planning";
import type { RecurringTransaction, SavingsGoal } from "@/types/phase3";
import type { Transaction } from "@/types/transactions";

const budgetProgress: BudgetProgressItem[] = [
  {
    category: "food",
    monthlyLimit: 100,
    spent: 125,
    remaining: -25,
    progress: 100,
    isOverBudget: true,
  },
];

const recurringTransactions: RecurringTransaction[] = [
  {
    id: "r1",
    user_id: "user-1",
    title: "Netflix",
    amount: 15,
    category: "entertainment",
    type: "expense",
    description: null,
    frequency: "monthly",
    start_date: "2026-03-01",
    next_occurrence: "2026-03-22T00:00:00.000Z",
    is_active: true,
    created_at: "2026-03-01T00:00:00.000Z",
  },
];

const savingsGoals: SavingsGoal[] = [
  {
    id: "s1",
    user_id: "user-1",
    name: "Emergency Fund",
    target_amount: 1000,
    current_amount: 400,
    target_date: "2026-12-31",
    created_at: "2026-03-01T00:00:00.000Z",
  },
];

const transactions: Transaction[] = [
  {
    id: "t1",
    user_id: "user-1",
    amount: 125,
    category: "food",
    type: "expense",
    description: "Groceries",
    created_at: "2026-03-18T00:00:00.000Z",
  },
];

describe("phase 3 helpers", () => {
  it("computes next recurring occurrence", () => {
    const nextOccurrence = getNextOccurrence("2026-03-01", "monthly", new Date("2026-03-20T00:00:00.000Z"));
    expect(nextOccurrence.startsWith("2026-04-01")).toBe(true);
  });

  it("builds savings progress", () => {
    const progress = buildSavingsProgress(savingsGoals);
    expect(progress[0].progress).toBe(40);
    expect(progress[0].remainingAmount).toBe(600);
  });

  it("builds smart alerts", () => {
    const progress = buildSavingsProgress(savingsGoals);
    const alerts = buildSmartAlerts({
      budgetProgress,
      recurringTransactions,
      savingsGoals: progress,
      transactions,
      now: new Date("2026-03-20T00:00:00.000Z"),
    });

    expect(alerts.some((alert) => alert.title.includes("Food"))).toBe(true);
    expect(alerts.some((alert) => alert.title.includes("Netflix"))).toBe(true);
    expect(alerts.some((alert) => alert.title.includes("Emergency Fund"))).toBe(true);
  });
});
