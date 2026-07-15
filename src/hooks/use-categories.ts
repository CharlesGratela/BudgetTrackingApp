import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { normalizeCategoryName } from "@/lib/transactions";
import { TRANSACTIONS_QUERY_KEY } from "@/hooks/use-transactions";
import { getDefaultCategories, isMissingFunctionError, isMissingRelationError, mergeCategories } from "@/lib/planning";
import type { BudgetCategory } from "@/types/planning";
import type { TransactionType } from "@/types/transactions";

const CATEGORIES_QUERY_KEY = "categories";

export const useCategories = (userId?: string, type?: TransactionType) =>
  useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, userId, type ?? "all"],
    enabled: !!userId,
    queryFn: async (): Promise<BudgetCategory[]> => {
      const { data, error } = await supabase.from("categories").select("*").eq("user_id", userId).order("name");

      if (error) {
        if (isMissingRelationError(error)) {
          return getDefaultCategories(type);
        }

        throw error;
      }

      const categories = (data ?? []).map((row) => ({
        ...(row as Omit<BudgetCategory, "name"> & { name: string }),
        name: normalizeCategoryName(row.name),
      }));

      return mergeCategories(categories, type);
    },
  });

export const useAddCategory = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, type }: { name: string; type: TransactionType }) => {
      const normalizedName = normalizeCategoryName(name);
      const { data, error } = await supabase
        .from("categories")
        .insert([
          {
            user_id: userId,
            name: normalizedName,
            type,
          },
        ])
        .select("*")
        .single();

      if (error) {
        if (isMissingRelationError(error)) {
          throw new Error("The categories table is not set up yet. Run supabase_phase2_setup.sql first.");
        }

        throw error;
      }

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY, userId] });
    },
  });
};

export const useDeleteCategory = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", categoryId).eq("user_id", userId);

      if (error) {
        if (isMissingRelationError(error)) {
          throw new Error("The categories table is not set up yet. Run supabase_phase2_setup.sql first.");
        }

        throw error;
      }

      return categoryId;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY, userId] });
    },
  });
};

export const useRenameCategory = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, oldName, newName }: { type: TransactionType; oldName: string; newName: string }) => {
      if (!userId) {
        throw new Error("You must be signed in.");
      }
      const { error } = await supabase.rpc("rename_category", {
        p_type: type,
        p_old_name: oldName,
        p_new_name: newName,
      });
      if (error) {
        throw isMissingFunctionError(error)
          ? new Error("Category rename isn't set up yet. Run supabase_phase13_setup.sql first.")
          : error;
      }
    },
    // A rename cascades to transactions/budgets/recurring, so refresh them all.
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY, userId] }),
        queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY, userId] }),
        queryClient.invalidateQueries({ queryKey: ["budget-goals", userId] }),
        queryClient.invalidateQueries({ queryKey: ["recurring-transactions", userId] }),
      ]);
    },
  });
};
