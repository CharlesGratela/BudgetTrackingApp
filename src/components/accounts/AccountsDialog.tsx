import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounts, useDeleteAccount, useSaveAccount } from "@/hooks/use-accounts";
import { useFormatters } from "@/hooks/use-formatters";
import type { Account, AccountType } from "@/types/accounts";

const ACCOUNT_TYPES: AccountType[] = ["checking", "savings", "credit", "cash", "investment"];

interface AccountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

const AccountsDialog = ({ open, onOpenChange, userId }: AccountsDialogProps) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [startingBalance, setStartingBalance] = useState("");
  const accountsQuery = useAccounts(userId);
  const saveAccount = useSaveAccount(userId);
  const deleteAccount = useDeleteAccount(userId);
  const { formatMoney } = useFormatters(userId);

  const handleAdd = async () => {
    if (!name.trim()) {
      toast.error("Enter an account name.");
      return;
    }
    try {
      await saveAccount.mutateAsync({ name, type, startingBalance: Number(startingBalance) || 0 });
      setName("");
      setType("checking");
      setStartingBalance("");
      toast.success("Account saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    }
  };

  const handleDelete = async (account: Account) => {
    try {
      await deleteAccount.mutateAsync(account.id);
      toast.success(`${account.name} removed.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 pt-6 pb-4 pr-12">
          <DialogTitle>Accounts</DialogTitle>
          <DialogDescription>Track balances across checking, savings, credit, and more.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="account-name">Name</Label>
              <Input id="account-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Checking" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(value: AccountType) => setType(value)}>
                <SelectTrigger aria-label="Account type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((accountType) => (
                    <SelectItem key={accountType} value={accountType}>
                      {accountType[0].toUpperCase() + accountType.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-balance">Starting balance</Label>
              <Input
                id="account-balance"
                type="number"
                step="0.01"
                value={startingBalance}
                onChange={(event) => setStartingBalance(event.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <Button type="button" onClick={handleAdd} disabled={saveAccount.isPending}>
            Add account
          </Button>

          <div className="space-y-2">
            {(accountsQuery.data ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                No accounts yet.
              </div>
            ) : (
              (accountsQuery.data ?? []).map((account) => (
                <div key={account.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <div>
                    <div className="font-medium text-foreground">{account.name}</div>
                    <div className="text-xs capitalize text-muted-foreground">
                      {account.type} - starts at {formatMoney(account.starting_balance)}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-rose-500"
                    onClick={() => handleDelete(account)}
                    aria-label={`Delete ${account.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountsDialog;
