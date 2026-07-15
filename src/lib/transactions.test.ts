import { buildTransactionPayload, roundMoney, transactionToFormValues } from "@/lib/transactions";
import type { Transaction } from "@/types/transactions";

describe("roundMoney", () => {
  it("removes binary float drift", () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(1.234)).toBe(1.23);
    expect(roundMoney(1.239)).toBe(1.24);
    expect(roundMoney(2820)).toBe(2820);
  });
});

describe("buildTransactionPayload", () => {
  it("anchors the picked date at noon UTC so it does not roll back a day", () => {
    const payload = buildTransactionPayload(
      { amount: "12.50", category: "food", description: "  Lunch  ", merchant: "  Cafe  ", receiptPath: "", accountId: "", date: "2026-03-11", type: "expense" },
      "user-1",
    );

    expect(payload.created_at).toBe("2026-03-11T12:00:00.000Z");
    expect(payload.amount).toBe(12.5);
    expect(payload.description).toBe("Lunch");
    expect(payload.merchant).toBe("Cafe");
    expect(payload.user_id).toBe("user-1");
  });

  it("round-trips the calendar date through form values", () => {
    const transaction: Transaction = {
      id: "t1",
      user_id: "user-1",
      amount: 12.5,
      category: "food",
      type: "expense",
      description: "Lunch",
      created_at: "2026-03-11T12:00:00.000Z",
    };

    expect(transactionToFormValues(transaction).date).toBe("2026-03-11");
  });
});
