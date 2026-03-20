import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { normalizeTransaction } from "@/lib/transactions";
import type { Transaction, TransactionMutationInput } from "@/types/transactions";

const TRANSACTIONS_QUERY_KEY = "transactions";

export const useTransactions = (userId?: string) =>
  useQuery({
    queryKey: [TRANSACTIONS_QUERY_KEY, userId],
    enabled: !!userId,
    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []).map(normalizeTransaction);
    },
  });

export const useTransaction = (userId?: string, transactionId?: string) =>
  useQuery({
    queryKey: [TRANSACTIONS_QUERY_KEY, userId, transactionId],
    enabled: !!userId && !!transactionId,
    queryFn: async (): Promise<Transaction | null> => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .eq("id", transactionId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? normalizeTransaction(data) : null;
    },
  });

export const useAddTransaction = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TransactionMutationInput) => {
      const { data, error } = await supabase
        .from("transactions")
        .insert([payload])
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return normalizeTransaction(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY, userId] });
    },
  });
};

export const useUpdateTransaction = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      payload,
    }: {
      transactionId: string;
      payload: TransactionMutationInput;
    }) => {
      const { data, error } = await supabase
        .from("transactions")
        .update(payload)
        .eq("id", transactionId)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return normalizeTransaction(data);
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY, userId] }),
        queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY, userId, variables.transactionId] }),
      ]);
    },
  });
};

export const useDeleteTransaction = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId)
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      return transactionId;
    },
    onSuccess: async (transactionId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY, userId] }),
        queryClient.removeQueries({ queryKey: [TRANSACTIONS_QUERY_KEY, userId, transactionId] }),
      ]);
    },
  });
};
