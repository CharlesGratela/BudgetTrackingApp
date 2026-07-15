import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getNextOccurrence, getRelationSetupError, getUpcomingOccurrences, normalizeRecurringTransaction } from "@/lib/phase3";
import { isMissingFunctionError } from "@/lib/planning";
import { normalizeCategoryName } from "@/lib/transactions";
import { TRANSACTIONS_QUERY_KEY } from "@/hooks/use-transactions";
import type { RecurringFrequency, RecurringTransaction } from "@/types/phase3";
import type { Transaction, TransactionType } from "@/types/transactions";

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
      endDate,
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
      endDate?: string;
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
        end_date: endDate || null,
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

export const useSkipRecurringOccurrence = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nextOccurrence, frequency }: { id: string; nextOccurrence: string; frequency: RecurringFrequency }) => {
      if (!userId) {
        throw new Error("You must be signed in.");
      }
      const advanced = getUpcomingOccurrences(nextOccurrence, frequency, 2)[1] ?? nextOccurrence;
      const { error } = await supabase
        .from("recurring_transactions")
        .update({ next_occurrence: advanced })
        .eq("id", id)
        .eq("user_id", userId);
      if (error) {
        throw getRelationSetupError(error, "recurring_transactions", "supabase_phase3_setup.sql");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [RECURRING_TRANSACTIONS_QUERY_KEY, userId] });
    },
  });
};

/**
 * Materializes every recurring occurrence that is now due, via an atomic,
 * idempotent Postgres function (supabase_phase6_setup.sql). Safe to fire on
 * every load: re-runs are a no-op because next_occurrence is advanced. If the
 * function isn't installed yet, this degrades to a no-op. Returns the created
 * transactions.
 */
export const useGenerateDueRecurring = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<Transaction[]> => {
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase.rpc("generate_due_recurring_transactions", {});

      if (error) {
        if (isMissingFunctionError(error)) {
          return [];
        }
        throw getRelationSetupError(error, "recurring_transactions", "supabase_phase3_setup.sql");
      }

      return (data ?? []) as Transaction[];
    },
    onSuccess: async (created) => {
      if (created.length === 0) {
        return;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [RECURRING_TRANSACTIONS_QUERY_KEY, userId] }),
        queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY, userId] }),
      ]);
    },
  });
};
