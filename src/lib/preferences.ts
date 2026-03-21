import { isMissingRelationError } from "@/lib/planning";
import { formatCurrency } from "@/lib/transactions";
import type { DefaultLandingPage, UserPreferences, UserPreferencesInput } from "@/types/preferences";

export const DEFAULT_USER_PREFERENCES: UserPreferencesInput = {
  preferred_currency: "USD",
  locale: "en-US",
  payday_frequency: "monthly",
  default_landing_page: "dashboard",
  budget_alerts_enabled: true,
  recurring_alerts_enabled: true,
  savings_alerts_enabled: true,
};

type PreferencesRow = Partial<UserPreferences> & {
  user_id: string;
};

export const normalizeUserPreferences = (row: PreferencesRow): UserPreferences => ({
  user_id: row.user_id,
  preferred_currency: row.preferred_currency ?? DEFAULT_USER_PREFERENCES.preferred_currency,
  locale: row.locale ?? DEFAULT_USER_PREFERENCES.locale,
  payday_frequency: row.payday_frequency ?? DEFAULT_USER_PREFERENCES.payday_frequency,
  default_landing_page: row.default_landing_page ?? DEFAULT_USER_PREFERENCES.default_landing_page,
  budget_alerts_enabled: row.budget_alerts_enabled ?? DEFAULT_USER_PREFERENCES.budget_alerts_enabled,
  recurring_alerts_enabled: row.recurring_alerts_enabled ?? DEFAULT_USER_PREFERENCES.recurring_alerts_enabled,
  savings_alerts_enabled: row.savings_alerts_enabled ?? DEFAULT_USER_PREFERENCES.savings_alerts_enabled,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const getDefaultPreferencesForUser = (userId: string): UserPreferences => ({
  user_id: userId,
  ...DEFAULT_USER_PREFERENCES,
});

export const getPreferenceSetupError = (error: unknown) => {
  if (isMissingRelationError(error)) {
    return new Error("The user_preferences table is not set up yet. Run supabase_phase4_setup.sql first.");
  }

  return error;
};

export const getDefaultLandingPath = (defaultLandingPage: DefaultLandingPage) =>
  defaultLandingPage === "analytics" ? "/analytics" : "/dashboard";

export const formatMoneyWithPreferences = (
  amount: number,
  preferences: Pick<UserPreferences, "preferred_currency" | "locale">,
) => {
  try {
    return new Intl.NumberFormat(preferences.locale, {
      style: "currency",
      currency: preferences.preferred_currency,
    }).format(amount);
  } catch {
    return formatCurrency(amount);
  }
};

export const formatDateWithPreferences = (
  value: string | Date,
  preferences: Pick<UserPreferences, "locale">,
  options?: Intl.DateTimeFormatOptions,
) => {
  try {
    return new Intl.DateTimeFormat(preferences.locale, options ?? {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleDateString();
  }
};
