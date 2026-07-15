import { format, isSameMonth, startOfYear, subDays, subMonths } from "date-fns";
import type { SalaryPeriod, Transaction, TransactionFilters } from "@/types/transactions";
import { roundMoney } from "@/lib/transactions";

export const getUniqueCategories = (transactions: Transaction[]) =>
  Array.from(new Set(transactions.map((transaction) => transaction.category))).sort();

export const getSalaryPeriods = (transactions: Transaction[]): SalaryPeriod[] => {
  const incomes = transactions
    .filter((transaction) => transaction.type === "income")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (incomes.length === 0) {
    return [];
  }

  const periods: SalaryPeriod[] = [];
  const latestIncomeDate = new Date(incomes[0].created_at);
  latestIncomeDate.setHours(0, 0, 0, 0);

  periods.push({
    id: "current-salary",
    label: `Current Salary Period (${format(latestIncomeDate, "MMM d")} - Now)`,
    start: latestIncomeDate,
    end: null,
    type: "salary",
  });

  for (let index = 0; index < incomes.length - 1; index += 1) {
    const startDate = new Date(incomes[index + 1].created_at);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(incomes[index].created_at);
    endDate.setHours(0, 0, 0, 0);

    periods.push({
      id: `salary-${index}`,
      label: `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`,
      start: startDate,
      end: endDate,
      type: "salary",
    });
  }

  return periods;
};

export const filterTransactions = (
  transactions: Transaction[],
  filters: TransactionFilters,
  periods: SalaryPeriod[],
  now = new Date(),
) => {
  const { selectedPeriod, typeFilter, categoryFilter, sortOrder, searchQuery, minAmount, maxAmount, customStartDate, customEndDate } = filters;
  let filtered = [...transactions];

  if (selectedPeriod === "this-month") {
    filtered = filtered.filter((transaction) => isSameMonth(new Date(transaction.created_at), now));
  } else if (selectedPeriod === "last-month") {
    const lastMonth = subMonths(now, 1);
    filtered = filtered.filter((transaction) => isSameMonth(new Date(transaction.created_at), lastMonth));
  } else if (selectedPeriod === "last-30-days") {
    const thirtyDaysAgo = subDays(now, 30);
    filtered = filtered.filter((transaction) => new Date(transaction.created_at).getTime() >= thirtyDaysAgo.getTime());
  } else if (selectedPeriod === "this-year") {
    const startOfThisYear = startOfYear(now);
    filtered = filtered.filter((transaction) => new Date(transaction.created_at).getTime() >= startOfThisYear.getTime());
  } else if (selectedPeriod === "custom") {
    filtered = filtered.filter((transaction) => {
      const transactionDate = new Date(transaction.created_at);
      const startDate = customStartDate ? new Date(`${customStartDate}T00:00:00.000Z`) : null;
      const endDate = customEndDate ? new Date(`${customEndDate}T23:59:59.999Z`) : null;

      if (startDate && transactionDate < startDate) {
        return false;
      }

      if (endDate && transactionDate > endDate) {
        return false;
      }

      return true;
    });
  } else if (selectedPeriod === "current-salary" || selectedPeriod.startsWith("salary-")) {
    const period = periods.find((item) => item.id === selectedPeriod);
    if (period) {
      filtered = filtered.filter((transaction) => {
        const date = new Date(transaction.created_at);
        if (period.end) {
          return date >= period.start && date < period.end;
        }
        return date >= period.start;
      });
    }
  }

  if (typeFilter !== "all") {
    filtered = filtered.filter((transaction) => transaction.type === typeFilter);
  }

  if (categoryFilter !== "all") {
    filtered = filtered.filter((transaction) => transaction.category === categoryFilter);
  }

  if (searchQuery.trim()) {
    const query = searchQuery.trim().toLowerCase();
    filtered = filtered.filter((transaction) => {
      const description = transaction.description?.toLowerCase() ?? "";
      return (
        transaction.category.toLowerCase().includes(query) ||
        transaction.type.toLowerCase().includes(query) ||
        description.includes(query)
      );
    });
  }

  if (minAmount.trim()) {
    const minimum = Number(minAmount);
    if (Number.isFinite(minimum)) {
      filtered = filtered.filter((transaction) => transaction.amount >= minimum);
    }
  }

  if (maxAmount.trim()) {
    const maximum = Number(maxAmount);
    if (Number.isFinite(maximum)) {
      filtered = filtered.filter((transaction) => transaction.amount <= maximum);
    }
  }

  filtered.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    const amountA = a.amount;
    const amountB = b.amount;

    switch (sortOrder) {
      case "date-asc":
        return dateA - dateB;
      case "amount-desc":
        return amountB - amountA;
      case "amount-asc":
        return amountA - amountB;
      case "date-desc":
      default:
        return dateB - dateA;
    }
  });

  return filtered;
};

export const buildSummary = (transactions: Transaction[]) => {
  let income = 0;
  let expenses = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "income") {
      income += transaction.amount;
    }

    if (transaction.type === "expense") {
      expenses += transaction.amount;
    }
  });

  return {
    total: roundMoney(income - expenses),
    income: roundMoney(income),
    expenses: roundMoney(expenses),
  };
};

export const buildDailyData = (transactions: Transaction[]) => {
  const map = new Map<string, { key: string; date: string; income: number; expense: number }>();
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const labelFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", timeZone: "UTC" });

  sorted.forEach((transaction) => {
    const instant = new Date(transaction.created_at);
    // Key by the full UTC calendar day so the same day-of-month across different
    // months/years is not collapsed into one bar.
    const key = instant.toISOString().slice(0, 10);
    if (!map.has(key)) {
      map.set(key, { key, date: labelFormatter.format(instant), income: 0, expense: 0 });
    }

    const entry = map.get(key);
    if (!entry) {
      return;
    }

    if (transaction.type === "income") {
      entry.income += transaction.amount;
    }

    if (transaction.type === "expense") {
      entry.expense += transaction.amount;
    }
  });

  return Array.from(map.values()).map((entry) => ({
    date: entry.date,
    income: roundMoney(entry.income),
    expense: roundMoney(entry.expense),
  }));
};

export const buildCategoryData = (transactions: Transaction[]) => {
  const map = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      const category = transaction.category || "Uncategorized";
      map.set(category, (map.get(category) || 0) + transaction.amount);
    });

  return Array.from(map.entries()).map(([name, value]) => ({ name, value: roundMoney(value) }));
};

export const buildInsights = (transactions: Transaction[]) => {
  const categoryTotals = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce<Record<string, number>>((accumulator, transaction) => {
      accumulator[transaction.category] = (accumulator[transaction.category] || 0) + transaction.amount;
      return accumulator;
    }, {});

  let topCategory = "";
  let topAmount = 0;

  Object.entries(categoryTotals).forEach(([category, amount]) => {
    if (amount > topAmount) {
      topCategory = category;
      topAmount = amount;
    }
  });

  return { topCategory, topAmount: roundMoney(topAmount) };
};

export const escapeCsvValue = (value: string | number | null | undefined) => {
  let stringValue = `${value ?? ""}`;
  // Neutralize spreadsheet formula injection: a string cell starting with = + - @
  // (or a control char) can execute when the CSV is opened in Excel/Sheets.
  // Only guard strings — numbers (e.g. negative amounts) are never a vector.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(stringValue)) {
    stringValue = `'${stringValue}`;
  }
  return `"${stringValue.replace(/"/g, '""')}"`;
};
