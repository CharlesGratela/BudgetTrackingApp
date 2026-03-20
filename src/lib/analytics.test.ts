import {
  buildCategoryData,
  buildInsights,
  buildSummary,
  filterTransactions,
  getSalaryPeriods,
  getUniqueCategories,
} from "@/lib/analytics";
import type { Transaction } from "@/types/transactions";

const transactions: Transaction[] = [
  {
    id: "1",
    user_id: "user-1",
    amount: 3000,
    category: "salary",
    type: "income",
    description: "Monthly salary",
    created_at: "2026-03-10T08:00:00.000Z",
  },
  {
    id: "2",
    user_id: "user-1",
    amount: 120,
    category: "food",
    type: "expense",
    description: "Groceries",
    created_at: "2026-03-11T08:00:00.000Z",
  },
  {
    id: "3",
    user_id: "user-1",
    amount: 60,
    category: "transport",
    type: "expense",
    description: "Fuel",
    created_at: "2026-03-12T08:00:00.000Z",
  },
  {
    id: "4",
    user_id: "user-1",
    amount: 2800,
    category: "salary",
    type: "income",
    description: "Previous salary",
    created_at: "2026-02-10T08:00:00.000Z",
  },
];

describe("analytics helpers", () => {
  it("builds salary periods from income transactions", () => {
    const periods = getSalaryPeriods(transactions);

    expect(periods).toHaveLength(2);
    expect(periods[0].id).toBe("current-salary");
    expect(periods[1].id).toBe("salary-0");
  });

  it("filters and summarizes transactions", () => {
    const periods = getSalaryPeriods(transactions);
    const filtered = filterTransactions(
      transactions,
      {
        selectedPeriod: "this-month",
        typeFilter: "all",
        categoryFilter: "all",
        sortOrder: "date-desc",
        searchQuery: "",
        minAmount: "",
        maxAmount: "",
        customStartDate: "",
        customEndDate: "",
      },
      periods,
      new Date("2026-03-20T00:00:00.000Z"),
    );

    const summary = buildSummary(filtered);

    expect(filtered).toHaveLength(3);
    expect(summary.income).toBe(3000);
    expect(summary.expenses).toBe(180);
    expect(summary.total).toBe(2820);
  });

  it("builds category insights for expenses", () => {
    const categoryData = buildCategoryData(transactions);
    const insights = buildInsights(transactions);

    expect(getUniqueCategories(transactions)).toEqual(["food", "salary", "transport"]);
    expect(categoryData).toEqual([
      { name: "food", value: 120 },
      { name: "transport", value: 60 },
    ]);
    expect(insights).toEqual({
      topCategory: "food",
      topAmount: 120,
    });
  });

  it("supports advanced text and custom date filters", () => {
    const periods = getSalaryPeriods(transactions);
    const filtered = filterTransactions(
      transactions,
      {
        selectedPeriod: "custom",
        typeFilter: "expense",
        categoryFilter: "all",
        sortOrder: "date-desc",
        searchQuery: "grocer",
        minAmount: "100",
        maxAmount: "150",
        customStartDate: "2026-03-01",
        customEndDate: "2026-03-31",
      },
      periods,
      new Date("2026-03-20T00:00:00.000Z"),
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].category).toBe("food");
  });
});
