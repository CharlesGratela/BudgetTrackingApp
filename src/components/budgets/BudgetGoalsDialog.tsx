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
  const [values, setValues] = useState<Record<string, string>>({});

  const initialValues = useMemo(() => {
    const draftValues: Record<string, string> = {};

    categories.forEach((category) => {
      const goal = budgetGoalsQuery.data?.find((item) => item.category === category);
      draftValues[category] = goal ? goal.monthly_limit.toString() : "";
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
        monthly_limit: Number(value),
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Monthly Budget Goals</DialogTitle>
          <DialogDescription>Set a monthly target for each expense category.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
          {categories.map((category) => (
            <div key={category} className="space-y-2">
              <Label htmlFor={`budget-${category}`}>{formatCategoryLabel(category)}</Label>
              <Input
                id={`budget-${category}`}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={values[category] ?? ""}
                onChange={(event) =>
                  setValues((currentValue) => ({
                    ...currentValue,
                    [category]: event.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={handleSave} disabled={saveBudgetGoals.isPending || budgetGoalsQuery.isLoading}>
            Save Goals
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetGoalsDialog;
