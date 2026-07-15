import { useCallback } from "react";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import {
  DEFAULT_USER_PREFERENCES,
  formatDateWithPreferences,
  formatMoneyWithPreferences,
} from "@/lib/preferences";

/**
 * Preference-aware money/date formatters.
 *
 * Use this everywhere money or dates are shown to the user — never call the
 * hardcoded-`$` `formatCurrency` or `toFixed`/`format` inline. Falls back to the
 * default currency/locale (USD / en-US) until the user's preferences have
 * loaded. See the `budgetflow-conventions` skill.
 */
export const useFormatters = (userId?: string) => {
  const { data } = useUserPreferences(userId);
  const preferredCurrency =
    data?.preferred_currency ?? DEFAULT_USER_PREFERENCES.preferred_currency;
  const locale = data?.locale ?? DEFAULT_USER_PREFERENCES.locale;

  const formatMoney = useCallback(
    (value: number) =>
      formatMoneyWithPreferences(value, { preferred_currency: preferredCurrency, locale }),
    [preferredCurrency, locale],
  );

  const formatDate = useCallback(
    (value: string | Date, options?: Intl.DateTimeFormatOptions) =>
      formatDateWithPreferences(value, { locale }, options),
    [locale],
  );

  return { formatMoney, formatDate, preferredCurrency, locale };
};
