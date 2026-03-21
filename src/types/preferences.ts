export type PreferredCurrency = "USD" | "PHP" | "EUR" | "GBP";
export type PaydayFrequency = "weekly" | "biweekly" | "monthly";
export type DefaultLandingPage = "dashboard" | "analytics";

export interface UserPreferences {
  user_id: string;
  preferred_currency: PreferredCurrency;
  locale: string;
  payday_frequency: PaydayFrequency;
  default_landing_page: DefaultLandingPage;
  budget_alerts_enabled: boolean;
  recurring_alerts_enabled: boolean;
  savings_alerts_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferencesInput {
  preferred_currency: PreferredCurrency;
  locale: string;
  payday_frequency: PaydayFrequency;
  default_landing_page: DefaultLandingPage;
  budget_alerts_enabled: boolean;
  recurring_alerts_enabled: boolean;
  savings_alerts_enabled: boolean;
}
