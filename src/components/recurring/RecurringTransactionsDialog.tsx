import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/use-categories";
import {
  useDeleteRecurringTransaction,
  useRecurringTransactions,
  useSaveRecurringTransaction,
} from "@/hooks/use-recurring-transactions";
import { formatCategoryLabel, formatCurrency } from "@/lib/transactions";
import type { RecurringFrequency, RecurringTransaction } from "@/types/phase3";
import type { TransactionType } from "@/types/transactions";

interface RecurringTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

const initialFormState = {
  title: "",
  amount: "",
  category: "",
  type: "expense" as TransactionType,
  description: "",
  frequency: "monthly" as RecurringFrequency,
  startDate: new Date().toISOString().split("T")[0],
  isActive: true,
};

const RecurringTransactionsDialog = ({
  open,
  onOpenChange,
  userId,
}: RecurringTransactionsDialogProps) => {
  const [formValues, setFormValues] = useState(initialFormState);
  const recurringQuery = useRecurringTransactions(userId);
  const categoriesQuery = useCategories(userId, formValues.type);
  const saveRecurringTransaction = useSaveRecurringTransaction(userId);
  const deleteRecurringTransaction = useDeleteRecurringTransaction(userId);

  const categoryOptions = useMemo(
    () => (categoriesQuery.data ?? []).map((category) => category.name),
    [categoriesQuery.data],
  );

  const handleCreateRecurring = async () => {
    if (!formValues.title.trim() || !formValues.amount || !formValues.category) {
      toast.error("Please complete the title, amount, and category.");
      return;
    }

    try {
      await saveRecurringTransaction.mutateAsync({
        title: formValues.title,
        amount: Number(formValues.amount),
        category: formValues.category,
        type: formValues.type,
        description: formValues.description,
        frequency: formValues.frequency,
        startDate: formValues.startDate,
        isActive: formValues.isActive,
      });

      setFormValues(initialFormState);
      toast.success("Recurring transaction saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    }
  };

  const handleDelete = async (item: RecurringTransaction) => {
    try {
      await deleteRecurringTransaction.mutateAsync(item.id);
      toast.success(`${item.title} removed.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 pt-6 pb-4 pr-12">
          <DialogTitle>Recurring Transactions</DialogTitle>
          <DialogDescription>Track recurring salary, bills, subscriptions, and other repeated entries.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recurring-title">Title</Label>
                <Input
                  id="recurring-title"
                  value={formValues.title}
                  onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, title: event.target.value }))}
                  placeholder="Rent, Netflix, Salary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="recurring-amount">Amount</Label>
                  <Input
                    id="recurring-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formValues.amount}
                    onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, amount: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formValues.type}
                    onValueChange={(value: TransactionType) =>
                      setFormValues((currentValue) => ({
                        ...currentValue,
                        type: value,
                        category: "",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formValues.category}
                    onValueChange={(value) => setFormValues((currentValue) => ({ ...currentValue, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category} value={category}>
                          {formatCategoryLabel(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={formValues.frequency}
                    onValueChange={(value: RecurringFrequency) =>
                      setFormValues((currentValue) => ({ ...currentValue, frequency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurring-start">Start Date</Label>
                <Input
                  id="recurring-start"
                  type="date"
                  value={formValues.startDate}
                  onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, startDate: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurring-description">Description</Label>
                <Textarea
                  id="recurring-description"
                  rows={3}
                  value={formValues.description}
                  onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, description: event.target.value }))}
                  placeholder="Optional note"
                />
              </div>

              <Button type="button" className="w-full gap-2" onClick={handleCreateRecurring} disabled={saveRecurringTransaction.isPending}>
                <Plus className="w-4 h-4" />
                Save Recurring Transaction
              </Button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto lg:max-h-[500px]">
              {(recurringQuery.data ?? []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                  No recurring transactions yet.
                </div>
              ) : (
                (recurringQuery.data ?? []).map((item) => (
                  <div key={item.id} className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-foreground">{item.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.type === "expense" ? "-" : "+"}
                          {formatCurrency(item.amount)} | {formatCategoryLabel(item.category)}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {item.frequency === "weekly" ? "Weekly" : "Monthly"} | Next {format(new Date(item.next_occurrence), "MMM d, yyyy")}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-rose-500"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecurringTransactionsDialog;
