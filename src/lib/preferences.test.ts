import { formatMoneyWithPreferences } from "@/lib/preferences";

describe("formatMoneyWithPreferences", () => {
  it("renders the user's preferred currency, not a hardcoded $", () => {
    expect(formatMoneyWithPreferences(1234.5, { preferred_currency: "USD", locale: "en-US" })).toContain("$");
    expect(formatMoneyWithPreferences(1234.5, { preferred_currency: "PHP", locale: "en-US" })).toContain("₱");
    expect(formatMoneyWithPreferences(1234.5, { preferred_currency: "EUR", locale: "en-US" })).toContain("€");
    expect(formatMoneyWithPreferences(1234.5, { preferred_currency: "GBP", locale: "en-US" })).toContain("£");
  });

  it("formats the amount to two decimals with grouping", () => {
    expect(formatMoneyWithPreferences(1234.5, { preferred_currency: "USD", locale: "en-US" })).toBe("$1,234.50");
  });

  it("falls back to a plain $ format when the currency code is malformed", () => {
    // A non-3-letter code makes Intl.NumberFormat throw RangeError; the helper must not crash.
    expect(formatMoneyWithPreferences(12, { preferred_currency: "US" as never, locale: "en-US" })).toBe("$12.00");
  });
});
