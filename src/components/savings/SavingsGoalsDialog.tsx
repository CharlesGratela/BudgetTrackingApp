import { useState } from "react";
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
import { useDeleteSavingsGoal, useSaveSavingsGoal, useSavingsGoals } from "@/hooks/use-savings-goals";
import { formatCurrency } from "@/lib/transactions";
import type { SavingsGoal } from "@/types/phase3";

interface SavingsGoalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

const initialFormState = {
  name: "",
  targetAmount: "",
  currentAmount: "",
  targetDate: "",
};

const SavingsGoalsDialog = ({ open, onOpenChange, userId }: SavingsGoalsDialogProps) => {
  const [formValues, setFormValues] = useState(initialFormState);
  const savingsGoalsQuery = useSavingsGoals(userId);
  const saveSavingsGoal = useSaveSavingsGoal(userId);
  const deleteSavingsGoal = useDeleteSavingsGoal(userId);

  const handleSaveGoal = async () => {
    if (!formValues.name.trim() || !formValues.targetAmount) {
      toast.error("Please provide a goal name and target amount.");
      return;
    }

    try {
      await saveSavingsGoal.mutateAsync({
        name: formValues.name,
        targetAmount: Number(formValues.targetAmount),
        currentAmount: Number(formValues.currentAmount || 0),
        targetDate: formValues.targetDate,
      });

      setFormValues(initialFormState);
      toast.success("Savings goal saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    }
  };

  const handleDelete = async (goal: SavingsGoal) => {
    try {
      await deleteSavingsGoal.mutateAsync(goal.id);
      toast.success(`${goal.name} removed.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 pt-6 pb-4 pr-12">
          <DialogTitle>Savings Goals</DialogTitle>
          <DialogDescription>Track long-term goals like emergency fund, travel, gadgets, or tuition.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                  id="goal-name"
                  value={formValues.name}
                  onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, name: event.target.value }))}
                  placeholder="Emergency Fund"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="target-amount">Target Amount</Label>
                  <Input
                    id="target-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formValues.targetAmount}
                    onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, targetAmount: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current-amount">Current Saved</Label>
                  <Input
                    id="current-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formValues.currentAmount}
                    onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, currentAmount: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-date">Target Date</Label>
                <Input
                  id="target-date"
                  type="date"
                  value={formValues.targetDate}
                  onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, targetDate: event.target.value }))}
                />
              </div>

              <Button type="button" className="w-full gap-2" onClick={handleSaveGoal} disabled={saveSavingsGoal.isPending}>
                <Plus className="w-4 h-4" />
                Save Savings Goal
              </Button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto lg:max-h-[500px]">
              {(savingsGoalsQuery.data ?? []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                  No savings goals yet.
                </div>
              ) : (
                (savingsGoalsQuery.data ?? []).map((goal) => (
                  <div key={goal.id} className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-foreground">{goal.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(goal.current_amount)} saved of {formatCurrency(goal.target_amount)}
                        </div>
                        {goal.target_date && (
                          <div className="mt-1 text-xs text-muted-foreground">Target {format(new Date(goal.target_date), "MMM d, yyyy")}</div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-rose-500"
                        onClick={() => handleDelete(goal)}
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

export default SavingsGoalsDialog;
