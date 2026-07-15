import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAddSavingsContribution,
  useDeleteSavingsContribution,
  useSavingsContributions,
} from "@/hooks/use-savings-contributions";

interface SavingsGoalContributionsProps {
  userId?: string;
  goalId: string;
  formatMoney: (value: number) => string;
}

const SavingsGoalContributions = ({ userId, goalId, formatMoney }: SavingsGoalContributionsProps) => {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const contributionsQuery = useSavingsContributions(userId, goalId);
  const addContribution = useAddSavingsContribution(userId);
  const deleteContribution = useDeleteSavingsContribution(userId);

  const handleAdd = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value === 0) {
      toast.error("Enter a non-zero amount.");
      return;
    }
    try {
      await addContribution.mutateAsync({ goalId, amount: value, note: note.trim() || undefined });
      setAmount("");
      setNote("");
      toast.success("Contribution added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add contribution.");
    }
  };

  const handleDelete = async (contributionId: string) => {
    try {
      await deleteContribution.mutateAsync({ contributionId, goalId });
      toast.success("Contribution removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove contribution.");
    }
  };

  const contributions = contributionsQuery.data ?? [];

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="number"
          step="0.01"
          inputMode="decimal"
          placeholder="Amount (negative to withdraw)"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-label="Contribution amount"
        />
        <Input
          placeholder="Note (optional)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          aria-label="Contribution note"
        />
        <Button type="button" size="sm" className="shrink-0 gap-1" onClick={handleAdd} disabled={addContribution.isPending}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {contributionsQuery.isLoading ? (
        <p className="text-xs text-muted-foreground">Loading contributions...</p>
      ) : contributionsQuery.isError ? (
        <p className="text-xs text-rose-500">Could not load contribution history.</p>
      ) : contributions.length === 0 ? (
        <p className="text-xs text-muted-foreground">No contributions yet. Add one above to build history.</p>
      ) : (
        <ul className="space-y-1">
          {contributions.map((contribution) => (
            <li key={contribution.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <span className={contribution.amount >= 0 ? "text-emerald-500" : "text-rose-500"}>
                  {contribution.amount >= 0 ? "+" : "-"}
                  {formatMoney(Math.abs(contribution.amount))}
                </span>
                {contribution.note && <span className="text-muted-foreground">{contribution.note}</span>}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{format(new Date(contribution.created_at), "MMM d")}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                  onClick={() => handleDelete(contribution.id)}
                  aria-label="Delete contribution"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SavingsGoalContributions;
