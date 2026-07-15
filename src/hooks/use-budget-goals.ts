import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { isMissingFunctionError, isMissingRelationError, normalizeBudgetGoal } from "@/lib/planning";
import { normalizeCategoryName } from "@/lib/transactions";
import type { BudgetGoal } from "@/types/planning";

const BUDGET_GOALS_QUERY_KEY = "budget-goals";

export const useBudgetGoals = (userId?: string, monthKey?: string) =>
  useQuery({
    queryKey: [BUDGET_GOALS_QUERY_KEY, userId, monthKey],
    enabled: !!userId && !!monthKey,
    queryFn: async (): Promise<BudgetGoal[]> => {
      const { data, error } = await supabase
        .from("budget_goals")
        .select("*")
        .eq("user_id", userId)
        .eq("month_key", monthKey)
        .order("category");

      if (error) {
        if (isMissingRelationError(error)) {
          return [];
        }

        throw error;
      }

      return (data ?? []).map(normalizeBudgetGoal);
    },
  });

type BudgetGoalInput = { category: string; monthly_limit: number; rollover_enabled: boolean };

const budgetGoalsSetupError = () =>
  new Error("The budget_goals table is not set up yet. Run supabase_phase2_setup.sql first.");

// Non-atomic two-step write, used only until supabase_phase5_setup.sql is applied.
const replaceBudgetGoalsFallback = async (userId: string, monthKey: string, goals: BudgetGoalInput[]) => {
  const deleteResult = await supabase.from("budget_goals").delete().eq("user_id", userId).eq("month_key", monthKey);
  if (deleteResult.error) {
    throw isMissingRelationError(deleteResult.error) ? budgetGoalsSetupError() : deleteResult.error;
  }

  if (goals.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("budget_goals")
    .insert(goals.map((goal) => ({ ...goal, user_id: userId, month_key: monthKey })))
    .select("*");

  if (error) {
    throw isMissingRelationError(error) ? budgetGoalsSetupError() : error;
  }

  return (data ?? []).map(normalizeBudgetGoal);
};

export const useSaveBudgetGoals = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      monthKey,
      goals,
    }: {
      monthKey: string;
      goals: BudgetGoalInput[];
    }) => {
      if (!userId) {
        throw new Error("You must be signed in to save budget goals.");
      }

      const normalizedGoals = goals.map((goal) => ({
        category: normalizeCategoryName(goal.category),
        monthly_limit: goal.monthly_limit,
        rollover_enabled: goal.rollover_enabled,
      }));

      // Atomic replace via a Postgres function (single transaction) so a failure
      // can't leave the month with its goals deleted but not re-inserted.
      const { data, error } = await supabase.rpc("replace_month_budget_goals", {
        p_month_key: monthKey,
        p_goals: normalizedGoals,
      });

      if (!error) {
        return (data ?? []).map(normalizeBudgetGoal);
      }

      if (isMissingRelationError(error)) {
        throw budgetGoalsSetupError();
      }

      // Until supabase_phase5_setup.sql is applied the function won't exist —
      // degrade to the previous (non-atomic) two-step write.
      if (isMissingFunctionError(error)) {
        return replaceBudgetGoalsFallback(userId, monthKey, normalizedGoals);
      }

      throw error;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: [BUDGET_GOALS_QUERY_KEY, userId, variables.monthKey] });
    },
  });
};
