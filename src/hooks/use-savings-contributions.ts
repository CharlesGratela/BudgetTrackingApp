import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { isMissingFunctionError, isMissingRelationError } from "@/lib/planning";
import { normalizeSavingsContribution } from "@/lib/phase3";
import { SAVINGS_GOALS_QUERY_KEY } from "@/hooks/use-savings-goals";
import type { SavingsContribution } from "@/types/phase3";

const SAVINGS_CONTRIBUTIONS_QUERY_KEY = "savings-contributions";

const notSetUpError = () =>
  new Error("Savings contributions aren't set up yet. Run supabase_phase8_setup.sql first.");

export const useSavingsContributions = (userId?: string, goalId?: string) =>
  useQuery({
    queryKey: [SAVINGS_CONTRIBUTIONS_QUERY_KEY, userId, goalId],
    enabled: !!userId && !!goalId,
    queryFn: async (): Promise<SavingsContribution[]> => {
      const { data, error } = await supabase
        .from("savings_contributions")
        .select("*")
        .eq("user_id", userId)
        .eq("savings_goal_id", goalId)
        .order("created_at", { ascending: false });

      if (error) {
        if (isMissingRelationError(error)) {
          return [];
        }
        throw error;
      }

      return (data ?? []).map(normalizeSavingsContribution);
    },
  });

export const useAddSavingsContribution = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, amount, note }: { goalId: string; amount: number; note?: string }) => {
      if (!userId) {
        throw new Error("You must be signed in to add a contribution.");
      }
      const { error } = await supabase.rpc("add_savings_contribution", {
        p_goal_id: goalId,
        p_amount: amount,
        p_note: note ?? null,
      });
      if (error) {
        throw isMissingFunctionError(error) || isMissingRelationError(error) ? notSetUpError() : error;
      }
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [SAVINGS_GOALS_QUERY_KEY, userId] }),
        queryClient.invalidateQueries({ queryKey: [SAVINGS_CONTRIBUTIONS_QUERY_KEY, userId, variables.goalId] }),
      ]);
    },
  });
};

export const useDeleteSavingsContribution = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contributionId }: { contributionId: string; goalId: string }) => {
      if (!userId) {
        throw new Error("You must be signed in.");
      }
      const { error } = await supabase.rpc("delete_savings_contribution", { p_contribution_id: contributionId });
      if (error) {
        throw isMissingFunctionError(error) || isMissingRelationError(error) ? notSetUpError() : error;
      }
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [SAVINGS_GOALS_QUERY_KEY, userId] }),
        queryClient.invalidateQueries({ queryKey: [SAVINGS_CONTRIBUTIONS_QUERY_KEY, userId, variables.goalId] }),
      ]);
    },
  });
};
