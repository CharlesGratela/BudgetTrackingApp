import { buildAccountBalances, buildNetWorth } from "@/lib/accounts";
import type { Account } from "@/types/accounts";
import type { Transaction } from "@/types/transactions";

const accounts: Account[] = [
  { id: "a1", user_id: "u", name: "Checking", type: "checking", starting_balance: 1000, created_at: "2026-01-01T00:00:00.000Z" },
  { id: "a2", user_id: "u", name: "Card", type: "credit", starting_balance: -200, created_at: "2026-01-01T00:00:00.000Z" },
];

const tx = (over: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(36).slice(2),
  user_id: "u",
  amount: 0,
  category: "food",
  type: "expense",
  description: null,
  created_at: "2026-03-01T12:00:00.000Z",
  account_id: "a1",
  ...over,
});

describe("account balances + net worth", () => {
  it("computes per-account balance from starting balance and its transactions", () => {
    const balances = buildAccountBalances(accounts, [
      tx({ type: "income", amount: 500, account_id: "a1" }),
      tx({ type: "expense", amount: 120.5, account_id: "a1" }),
      tx({ type: "expense", amount: 50, account_id: "a2" }),
    ]);

    expect(balances.find((b) => b.id === "a1")?.balance).toBe(1379.5); // 1000 + 500 - 120.5
    expect(balances.find((b) => b.id === "a2")?.balance).toBe(-250); // -200 - 50
  });

  it("sums account balances into net worth", () => {
    expect(buildNetWorth(buildAccountBalances(accounts, []))).toBe(800); // 1000 + (-200)
  });
});
