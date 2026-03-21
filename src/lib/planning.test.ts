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
    rollover_enabled: false,
    month_key: "2026-03",
    created_at: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "g2",
    user_id: "user-1",
    category: "transport",
    monthly_limit: 80,
    rollover_enabled: false,
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
      baseMonthlyLimit: 100,
      carriedOver: 0,
      monthlyLimit: 100,
      spent: 120,
      remaining: -20,
      progress: 100,
      isOverBudget: true,
      rolloverEnabled: false,
    });
    expect(progress[1].remaining).toBe(40);
  });

  it("carries over unused budget when rollover is enabled", () => {
    const currentGoals: BudgetGoal[] = [
      {
        id: "g3",
        user_id: "user-1",
        category: "shopping",
        monthly_limit: 100,
        rollover_enabled: true,
        month_key: "2026-03",
        created_at: "2026-03-01T00:00:00.000Z",
      },
    ];

    const previousGoals: BudgetGoal[] = [
      {
        id: "g4",
        user_id: "user-1",
        category: "shopping",
        monthly_limit: 90,
        rollover_enabled: true,
        month_key: "2026-02",
        created_at: "2026-02-01T00:00:00.000Z",
      },
    ];

    const rolloverTransactions: Transaction[] = [
      {
        id: "t3",
        user_id: "user-1",
        amount: 30,
        category: "shopping",
        type: "expense",
        description: "Supplies",
        created_at: "2026-02-14T08:00:00.000Z",
      },
      {
        id: "t4",
        user_id: "user-1",
        amount: 50,
        category: "shopping",
        type: "expense",
        description: "March order",
        created_at: "2026-03-10T08:00:00.000Z",
      },
    ];

    const progress = buildBudgetProgress(currentGoals, rolloverTransactions, "2026-03", previousGoals);

    expect(progress[0].carriedOver).toBe(60);
    expect(progress[0].monthlyLimit).toBe(160);
    expect(progress[0].remaining).toBe(110);
  });

  it("builds a month key", () => {
    expect(getMonthKey(new Date("2026-03-20T00:00:00.000Z"))).toBe("2026-03");
  });
});
