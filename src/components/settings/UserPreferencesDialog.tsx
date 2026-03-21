import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSaveUserPreferences, useUserPreferences } from "@/hooks/use-user-preferences";
import { DEFAULT_USER_PREFERENCES } from "@/lib/preferences";
import type { UserPreferencesInput } from "@/types/preferences";

interface UserPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

const UserPreferencesDialog = ({
  open,
  onOpenChange,
  userId,
}: UserPreferencesDialogProps) => {
  const preferencesQuery = useUserPreferences(userId);
  const savePreferences = useSaveUserPreferences(userId);
  const [values, setValues] = useState<UserPreferencesInput>(DEFAULT_USER_PREFERENCES);

  useEffect(() => {
    if (open && preferencesQuery.data) {
      setValues({
        preferred_currency: preferencesQuery.data.preferred_currency,
        locale: preferencesQuery.data.locale,
        payday_frequency: preferencesQuery.data.payday_frequency,
        default_landing_page: preferencesQuery.data.default_landing_page,
        budget_alerts_enabled: preferencesQuery.data.budget_alerts_enabled,
        recurring_alerts_enabled: preferencesQuery.data.recurring_alerts_enabled,
        savings_alerts_enabled: preferencesQuery.data.savings_alerts_enabled,
      });
    }
  }, [open, preferencesQuery.data]);

  const handleSave = async () => {
    try {
      await savePreferences.mutateAsync(values);
      toast.success("Preferences saved.");
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 pt-6 pb-4 pr-12">
          <DialogTitle>Profile and Preferences</DialogTitle>
          <DialogDescription>Personalize how BudgetFlow formats money, dates, alerts, and your default home screen.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Preferred Currency</Label>
              <Select
                value={values.preferred_currency}
                onValueChange={(value) =>
                  setValues((current) => ({ ...current, preferred_currency: value as UserPreferencesInput["preferred_currency"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="PHP">PHP</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Locale / Date Format</Label>
              <Select
                value={values.locale}
                onValueChange={(value) => setValues((current) => ({ ...current, locale: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select locale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English (United States)</SelectItem>
                  <SelectItem value="en-PH">English (Philippines)</SelectItem>
                  <SelectItem value="en-GB">English (United Kingdom)</SelectItem>
                  <SelectItem value="de-DE">German (Germany)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payday Frequency</Label>
              <Select
                value={values.payday_frequency}
                onValueChange={(value) =>
                  setValues((current) => ({ ...current, payday_frequency: value as UserPreferencesInput["payday_frequency"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payday frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Biweekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Landing Page</Label>
              <Select
                value={values.default_landing_page}
                onValueChange={(value) =>
                  setValues((current) => ({ ...current, default_landing_page: value as UserPreferencesInput["default_landing_page"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select landing page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Dashboard Overview</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border p-4">
            <div>
              <h3 className="font-medium text-foreground">Notification Preferences</h3>
              <p className="text-sm text-muted-foreground">Choose which in-app smart alerts should appear on your dashboard.</p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="budget-alerts">Budget Alerts</Label>
                <p className="text-sm text-muted-foreground">Warn when a category goes over budget.</p>
              </div>
              <Switch
                id="budget-alerts"
                checked={values.budget_alerts_enabled}
                onCheckedChange={(checked) => setValues((current) => ({ ...current, budget_alerts_enabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="recurring-alerts">Recurring Alerts</Label>
                <p className="text-sm text-muted-foreground">Show upcoming recurring bills and income reminders.</p>
              </div>
              <Switch
                id="recurring-alerts"
                checked={values.recurring_alerts_enabled}
                onCheckedChange={(checked) => setValues((current) => ({ ...current, recurring_alerts_enabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="savings-alerts">Savings Alerts</Label>
                <p className="text-sm text-muted-foreground">Highlight savings goals that are still in progress.</p>
              </div>
              <Switch
                id="savings-alerts"
                checked={values.savings_alerts_enabled}
                onCheckedChange={(checked) => setValues((current) => ({ ...current, savings_alerts_enabled: checked }))}
              />
            </div>
          </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-border px-6 py-4">
          <Button type="button" onClick={handleSave} disabled={savePreferences.isPending || preferencesQuery.isLoading}>
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserPreferencesDialog;
