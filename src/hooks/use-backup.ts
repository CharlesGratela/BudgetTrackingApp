import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { BACKUP_VERSION, triggerDownload } from "@/lib/backup";
import { TRANSACTIONS_QUERY_KEY } from "@/hooks/use-transactions";

const EXPORT_TABLES = [
  "transactions",
  "categories",
  "budget_goals",
  "recurring_transactions",
  "savings_goals",
  "savings_contributions",
  "user_preferences",
] as const;

/** Download a JSON backup of every table the signed-in user owns. */
export const useExportBackup = (userId?: string) =>
  useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("You must be signed in to export.");
      }

      const data: Record<string, unknown[]> = {};
      for (const table of EXPORT_TABLES) {
        const { data: rows, error } = await supabase.from(table).select("*").eq("user_id", userId);
        // A table that doesn't exist yet (older schema) is exported as empty.
        data[table] = error ? [] : rows ?? [];
      }

      const exportedAt = new Date().toISOString();
      triggerDownload(
        `budgetflow-backup-${exportedAt.slice(0, 10)}.json`,
        JSON.stringify({ version: BACKUP_VERSION, exportedAt, data }, null, 2),
      );
      return data;
    },
  });

const num = (value: unknown) => Number(value);
const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);

/** Additively import transactions from a backup (never overwrites existing rows). */
export const useImportTransactions = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rows: Record<string, unknown>[]): Promise<number> => {
      if (!userId) {
        throw new Error("You must be signed in to import.");
      }

      const payload = rows
        .map((row) => ({
          user_id: userId,
          amount: num(row.amount),
          category: str(row.category, "other"),
          type: row.type === "income" ? "income" : "expense",
          description: typeof row.description === "string" ? row.description : null,
          merchant: typeof row.merchant === "string" ? row.merchant : null,
          created_at: str(row.created_at) || new Date().toISOString(),
        }))
        .filter((row) => Number.isFinite(row.amount));

      if (payload.length === 0) {
        return 0;
      }

      const chunkSize = 500;
      for (let index = 0; index < payload.length; index += chunkSize) {
        const { error } = await supabase.from("transactions").insert(payload.slice(index, index + chunkSize));
        if (error) {
          throw error;
        }
      }

      await queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY, userId] });
      return payload.length;
    },
  });
};
