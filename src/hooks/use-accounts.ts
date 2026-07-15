import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { isMissingRelationError } from "@/lib/planning";
import { normalizeAccount } from "@/lib/accounts";
import type { Account, AccountType } from "@/types/accounts";

const ACCOUNTS_QUERY_KEY = "accounts";

const notSetUpError = () =>
  new Error("Accounts aren't set up yet. Run supabase_phase14_setup.sql first.");

export const useAccounts = (userId?: string) =>
  useQuery({
    queryKey: [ACCOUNTS_QUERY_KEY, userId],
    enabled: !!userId,
    queryFn: async (): Promise<Account[]> => {
      const { data, error } = await supabase.from("accounts").select("*").eq("user_id", userId).order("created_at");
      if (error) {
        if (isMissingRelationError(error)) {
          return [];
        }
        throw error;
      }
      return (data ?? []).map(normalizeAccount);
    },
  });

export const useSaveAccount = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      type,
      startingBalance,
    }: {
      id?: string;
      name: string;
      type: AccountType;
      startingBalance: number;
    }) => {
      if (!userId) {
        throw new Error("You must be signed in.");
      }
      const payload = { user_id: userId, name: name.trim(), type, starting_balance: startingBalance };
      const query = id
        ? supabase.from("accounts").update(payload).eq("id", id).eq("user_id", userId).select("*").single()
        : supabase.from("accounts").insert([payload]).select("*").single();
      const { data, error } = await query;
      if (error) {
        throw isMissingRelationError(error) ? notSetUpError() : error;
      }
      return normalizeAccount(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY, userId] });
    },
  });
};

export const useDeleteAccount = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) {
        throw new Error("You must be signed in.");
      }
      const { error } = await supabase.from("accounts").delete().eq("id", id).eq("user_id", userId);
      if (error) {
        throw isMissingRelationError(error) ? notSetUpError() : error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY, userId] });
    },
  });
};
