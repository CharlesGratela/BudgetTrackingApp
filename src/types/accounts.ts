export type AccountType = "checking" | "savings" | "credit" | "cash" | "investment";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  starting_balance: number;
  created_at: string;
}

export interface AccountBalance {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
}
