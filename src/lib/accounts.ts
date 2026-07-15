import { roundMoney } from "@/lib/transactions";
import type { Account, AccountBalance } from "@/types/accounts";
import type { Transaction } from "@/types/transactions";

export const normalizeAccount = (
  row: Omit<Account, "starting_balance"> & { starting_balance: number | string },
): Account => ({
  ...row,
  starting_balance: Number(row.starting_balance),
});

/** Current balance per account = starting balance + net of its transactions. */
export const buildAccountBalances = (accounts: Account[], transactions: Transaction[]): AccountBalance[] => {
  const netByAccount = new Map<string, number>();
  transactions.forEach((transaction) => {
    if (!transaction.account_id) {
      return;
    }
    const delta = transaction.type === "income" ? transaction.amount : -transaction.amount;
    netByAccount.set(transaction.account_id, (netByAccount.get(transaction.account_id) ?? 0) + delta);
  });

  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    balance: roundMoney(account.starting_balance + (netByAccount.get(account.id) ?? 0)),
  }));
};

export const buildNetWorth = (balances: AccountBalance[]): number =>
  roundMoney(balances.reduce((sum, balance) => sum + balance.balance, 0));
