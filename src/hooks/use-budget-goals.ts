import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { isMissingRelationError, normalizeBudgetGoal } from "@/lib/planning";
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

export const useSaveBudgetGoals = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      monthKey,
      goals,
    }: {
      monthKey: string;
      goals: Array<{ category: string; monthly_limit: number; rollover_enabled: boolean }>;
    }) => {
      const deleteResult = await supabase.from("budget_goals").delete().eq("user_id", userId).eq("month_key", monthKey);

      if (deleteResult.error) {
        if (isMissingRelationError(deleteResult.error)) {
          throw new Error("The budget_goals table is not set up yet. Run supabase_phase2_setup.sql first.");
        }

        throw deleteResult.error;
      }

      if (goals.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from("budget_goals")
        .insert(
          goals.map((goal) => ({
            user_id: userId,
            category: normalizeCategoryName(goal.category),
            monthly_limit: goal.monthly_limit,
            rollover_enabled: goal.rollover_enabled,
            month_key: monthKey,
          })),
        )
        .select("*");

      if (error) {
        if (isMissingRelationError(error)) {
          throw new Error("The budget_goals table is not set up yet. Run supabase_phase2_setup.sql first.");
        }

        throw error;
      }

      return (data ?? []).map(normalizeBudgetGoal);
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: [BUDGET_GOALS_QUERY_KEY, userId, variables.monthKey] });
    },
  });
};
