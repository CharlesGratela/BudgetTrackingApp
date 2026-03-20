import { buildBudgetProgress, getMonthKey, mergeCategories } from "@/lib/planning";
import type { BudgetGoal } from "@/types/planning";
import type { Transaction } from "@/types/transactions";

const transactions: Transaction[] = [
  {
    id: "t1",
    user_id: "user-1",
    amount: 120,
    category: "food",
    type: "expense",
    description: "Groceries",
    created_at: "2026-03-10T08:00:00.000Z",
  },
  {
    id: "t2",
    user_id: "user-1",
    amount: 40,
    category: "transport",
    type: "expense",
    description: "Fare",
    created_at: "2026-03-12T08:00:00.000Z",
  },
];

const goals: BudgetGoal[] = [
  {
    id: "g1",
    user_id: "user-1",
    category: "food",
    monthly_limit: 100,
    month_key: "2026-03",
    created_at: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "g2",
    user_id: "user-1",
    category: "transport",
    monthly_limit: 80,
    month_key: "2026-03",
    created_at: "2026-03-01T00:00:00.000Z",
  },
];

describe("planning helpers", () => {
  it("merges custom categories with defaults", () => {
    const categories = mergeCategories([
      {
        id: "c1",
        user_id: "user-1",
        name: "pet care",
        type: "expense",
      },
    ], "expense");

    expect(categories.some((category) => category.name === "housing")).toBe(true);
    expect(categories.some((category) => category.name === "pet care")).toBe(true);
  });

  it("builds monthly budget progress", () => {
    const progress = buildBudgetProgress(goals, transactions, "2026-03");

    expect(progress[0]).toEqual({
      category: "food",
      monthlyLimit: 100,
      spent: 120,
      remaining: -20,
      progress: 100,
      isOverBudget: true,
    });
    expect(progress[1].remaining).toBe(40);
  });

  it("builds a month key", () => {
    expect(getMonthKey(new Date("2026-03-20T00:00:00.000Z"))).toBe("2026-03");
  });
});
