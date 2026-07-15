import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useGenerateDueRecurring } from "@/hooks/use-recurring-transactions";

// Ensures generation fires at most once per app session (JS module lifetime),
// no matter which authed page mounts first. Reset on error so a later page can
// retry. The underlying RPC is idempotent, so redundant calls are harmless.
let generatedThisSession = false;

/**
 * Materializes any due recurring transactions once per session, as soon as a
 * user id is available. Call from every authed landing page (dashboard,
 * analytics) so it runs regardless of the user's default landing preference.
 */
export const useAutoGenerateRecurring = (userId?: string) => {
  const generateDueRecurring = useGenerateDueRecurring(userId);
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!userId || generatedThisSession || triggeredRef.current) {
      return;
    }
    triggeredRef.current = true;
    generatedThisSession = true;

    generateDueRecurring.mutate(undefined, {
      onSuccess: (created) => {
        if (created.length > 0) {
          toast.success(`Added ${created.length} recurring transaction${created.length === 1 ? "" : "s"}.`);
        }
      },
      onError: () => {
        // Best-effort on load; allow a later navigation to retry.
        generatedThisSession = false;
      },
    });
  }, [userId, generateDueRecurring]);
};
