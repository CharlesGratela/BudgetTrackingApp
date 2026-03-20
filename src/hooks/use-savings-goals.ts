import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getRelationSetupError, normalizeSavingsGoal } from "@/lib/phase3";
import type { SavingsGoal } from "@/types/phase3";

const SAVINGS_GOALS_QUERY_KEY = "savings-goals";

export const useSavingsGoals = (userId?: string) =>
  useQuery({
    queryKey: [SAVINGS_GOALS_QUERY_KEY, userId],
    enabled: !!userId,
    queryFn: async (): Promise<SavingsGoal[]> => {
      const { data, error } = await supabase.from("savings_goals").select("*").eq("user_id", userId).order("created_at");

      if (error) {
        throw getRelationSetupError(error, "savings_goals", "supabase_phase3_setup.sql");
      }

      return (data ?? []).map(normalizeSavingsGoal);
    },
  });

export const useSaveSavingsGoal = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      targetAmount,
      currentAmount,
      targetDate,
    }: {
      id?: string;
      name: string;
      targetAmount: number;
      currentAmount: number;
      targetDate: string;
    }) => {
      const payload = {
        user_id: userId,
        name: name.trim(),
        target_amount: targetAmount,
        current_amount: currentAmount,
        target_date: targetDate || null,
      };

      const query = id
        ? supabase.from("savings_goals").update(payload).eq("id", id).eq("user_id", userId).select("*").single()
        : supabase.from("savings_goals").insert([payload]).select("*").single();

      const { data, error } = await query;

      if (error) {
        throw getRelationSetupError(error, "savings_goals", "supabase_phase3_setup.sql");
      }

      return normalizeSavingsGoal(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [SAVINGS_GOALS_QUERY_KEY, userId] });
    },
  });
};

export const useDeleteSavingsGoal = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("savings_goals").delete().eq("id", id).eq("user_id", userId);

      if (error) {
        throw getRelationSetupError(error, "savings_goals", "supabase_phase3_setup.sql");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [SAVINGS_GOALS_QUERY_KEY, userId] });
    },
  });
};
