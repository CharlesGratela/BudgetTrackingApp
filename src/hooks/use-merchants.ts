import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const MERCHANTS_QUERY_KEY = "merchants";

/**
 * Distinct merchant names the user has used before, for form autocomplete.
 * Degrades to an empty list until the merchant column exists (phase 10).
 */
export const useMerchants = (userId?: string) =>
  useQuery({
    queryKey: [MERCHANTS_QUERY_KEY, userId],
    enabled: !!userId,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("transactions")
        .select("merchant")
        .eq("user_id", userId)
        .not("merchant", "is", null)
        .limit(1000);

      if (error) {
        return [];
      }

      const merchants = new Set<string>();
      (data ?? []).forEach((row) => {
        const value = (row as { merchant?: string | null }).merchant;
        if (value) {
          merchants.add(value);
        }
      });
      return Array.from(merchants).sort((a, b) => a.localeCompare(b));
    },
  });
