import { useEffect, useMemo, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { useBudgetGoals, useSaveBudgetGoals } from "@/hooks/use-budget-goals";
import { formatCategoryLabel } from "@/lib/transactions";

interface BudgetGoalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  monthKey: string;
  categories: string[];
}

const BudgetGoalsDialog = ({
  open,
  onOpenChange,
  userId,
  monthKey,
  categories,
}: BudgetGoalsDialogProps) => {
  const budgetGoalsQuery = useBudgetGoals(userId, monthKey);
  const saveBudgetGoals = useSaveBudgetGoals(userId);
  const [values, setValues] = useState<Record<string, { amount: string; rolloverEnabled: boolean }>>({});

  const initialValues = useMemo(() => {
    const draftValues: Record<string, { amount: string; rolloverEnabled: boolean }> = {};

    categories.forEach((category) => {
      const goal = budgetGoalsQuery.data?.find((item) => item.category === category);
      draftValues[category] = {
        amount: goal ? goal.monthly_limit.toString() : "",
        rolloverEnabled: goal?.rollover_enabled ?? false,
      };
    });

    return draftValues;
  }, [budgetGoalsQuery.data, categories]);

  useEffect(() => {
    if (open) {
      setValues(initialValues);
    }
  }, [initialValues, open]);

  const handleSave = async () => {
    const goals = Object.entries(values)
      .map(([category, value]) => ({
        category,
        monthly_limit: Number(value.amount),
        rollover_enabled: value.rolloverEnabled,
      }))
      .filter((goal) => Number.isFinite(goal.monthly_limit) && goal.monthly_limit > 0);

    try {
      await saveBudgetGoals.mutateAsync({ monthKey, goals });
      toast.success("Budget goals saved.");
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 pt-6 pb-4 pr-12">
          <DialogTitle>Monthly Budget Goals</DialogTitle>
          <DialogDescription>Set a monthly target for each expense category.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {categories.map((category) => (
              <div key={category} className="space-y-3 rounded-2xl border border-border p-4">
                <Label htmlFor={`budget-${category}`}>{formatCategoryLabel(category)}</Label>
                <Input
                  id={`budget-${category}`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={values[category]?.amount ?? ""}
                  onChange={(event) =>
                    setValues((currentValue) => ({
                      ...currentValue,
                      [category]: {
                        amount: event.target.value,
                        rolloverEnabled: currentValue[category]?.rolloverEnabled ?? false,
                      },
                    }))
                  }
                />
                <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 px-3 py-2">
                  <div>
                    <div className="text-sm font-medium text-foreground">Enable rollover</div>
                    <div className="text-xs text-muted-foreground">Carry unused budget into the next month.</div>
                  </div>
                  <Switch
                    checked={values[category]?.rolloverEnabled ?? false}
                    onCheckedChange={(checked) =>
                      setValues((currentValue) => ({
                        ...currentValue,
                        [category]: {
                          amount: currentValue[category]?.amount ?? "",
                          rolloverEnabled: checked,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-border px-6 py-4">
          <Button type="button" onClick={handleSave} disabled={saveBudgetGoals.isPending || budgetGoalsQuery.isLoading}>
            Save Goals
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetGoalsDialog;
