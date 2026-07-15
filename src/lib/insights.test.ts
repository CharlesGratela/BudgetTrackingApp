import { buildMonthComparison } from "@/lib/insights";
import type { Transaction } from "@/types/transactions";

const tx = (over: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(36).slice(2),
  user_id: "u",
  amount: 0,
  category: "food",
  type: "expense",
  description: null,
  created_at: "2026-03-10T12:00:00.000Z",
  ...over,
});

describe("buildMonthComparison", () => {
  const transactions: Transaction[] = [
    // March (current)
    tx({ amount: 3000, category: "salary", type: "income", created_at: "2026-03-05T12:00:00.000Z" }),
    tx({ amount: 200, category: "food", created_at: "2026-03-10T12:00:00.000Z" }),
    tx({ amount: 150, category: "transport", created_at: "2026-03-12T12:00:00.000Z" }),
    // February (previous)
    tx({ amount: 2800, category: "salary", type: "income", created_at: "2026-02-05T12:00:00.000Z" }),
    tx({ amount: 100, category: "food", created_at: "2026-02-10T12:00:00.000Z" }),
    // January (ignored)
    tx({ amount: 999, category: "food", created_at: "2026-01-10T12:00:00.000Z" }),
  ];

  it("computes income/expense/net deltas vs the previous month", () => {
    const c = buildMonthComparison(transactions, "2026-03");

    expect(c.previousMonthKey).toBe("2026-02");
    expect(c.income).toMatchObject({ current: 3000, previous: 2800, change: 200 });
    expect(c.expenses).toMatchObject({ current: 350, previous: 100, change: 250 });
    expect(c.net).toMatchObject({ current: 2650, previous: 2700, change: -50 });
  });

  it("ranks top category movers by absolute change and excludes other months", () => {
    const c = buildMonthComparison(transactions, "2026-03");

    // food: 100 -> 200 (+100); transport: 0 -> 150 (+150). Transport moved most.
    expect(c.topMovers.map((m) => m.category)).toEqual(["transport", "food"]);
    expect(c.topMovers[0]).toMatchObject({ category: "transport", current: 150, previous: 0, change: 150 });
    // January's 999 must not leak into either month.
    expect(c.expenses.current + c.expenses.previous).toBe(450);
  });

  it("returns null percent change when the previous value is 0", () => {
    const c = buildMonthComparison(transactions, "2026-03");
    const transport = c.topMovers.find((m) => m.category === "transport");
    expect(transport?.changePct).toBeNull();
    expect(c.income.changePct).toBeCloseTo(7.14, 1);
  });
});
