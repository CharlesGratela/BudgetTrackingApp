import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getNextOccurrence, getRelationSetupError, normalizeRecurringTransaction } from "@/lib/phase3";
import { normalizeCategoryName } from "@/lib/transactions";
import type { RecurringFrequency, RecurringTransaction } from "@/types/phase3";
import type { TransactionType } from "@/types/transactions";

const RECURRING_TRANSACTIONS_QUERY_KEY = "recurring-transactions";

export const useRecurringTransactions = (userId?: string) =>
  useQuery({
    queryKey: [RECURRING_TRANSACTIONS_QUERY_KEY, userId],
    enabled: !!userId,
    queryFn: async (): Promise<RecurringTransaction[]> => {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("next_occurrence");

      if (error) {
        throw getRelationSetupError(error, "recurring_transactions", "supabase_phase3_setup.sql");
      }

      return (data ?? []).map(normalizeRecurringTransaction);
    },
  });

export const useSaveRecurringTransaction = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      amount,
      category,
      type,
      description,
      frequency,
      startDate,
      isActive,
    }: {
      id?: string;
      title: string;
      amount: number;
      category: string;
      type: TransactionType;
      description: string;
      frequency: RecurringFrequency;
      startDate: string;
      isActive: boolean;
    }) => {
      const payload = {
        user_id: userId,
        title: title.trim(),
        amount,
        category: normalizeCategoryName(category),
        type,
        description: description.trim() || null,
        frequency,
        start_date: startDate,
        next_occurrence: getNextOccurrence(startDate, frequency),
        is_active: isActive,
      };

      const query = id
        ? supabase.from("recurring_transactions").update(payload).eq("id", id).eq("user_id", userId).select("*").single()
        : supabase.from("recurring_transactions").insert([payload]).select("*").single();

      const { data, error } = await query;

      if (error) {
        throw getRelationSetupError(error, "recurring_transactions", "supabase_phase3_setup.sql");
      }

      return normalizeRecurringTransaction(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [RECURRING_TRANSACTIONS_QUERY_KEY, userId] });
    },
  });
};

export const useDeleteRecurringTransaction = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_transactions").delete().eq("id", id).eq("user_id", userId);

      if (error) {
        throw getRelationSetupError(error, "recurring_transactions", "supabase_phase3_setup.sql");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [RECURRING_TRANSACTIONS_QUERY_KEY, userId] });
    },
  });
};
