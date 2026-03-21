import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, isSameMonth } from "date-fns";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  LayoutDashboard,
  PiggyBank,
  Plus,
  Repeat,
  Settings2,
  Target,
  Wallet,
} from "lucide-react";
import BudgetGoalsDialog from "@/components/budgets/BudgetGoalsDialog";
import CategoryManagerDialog from "@/components/categories/CategoryManagerDialog";
import RecurringTransactionsDialog from "@/components/recurring/RecurringTransactionsDialog";
import SavingsGoalsDialog from "@/components/savings/SavingsGoalsDialog";
import UserPreferencesDialog from "@/components/settings/UserPreferencesDialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useBudgetGoals } from "@/hooks/use-budget-goals";
import { useCategories } from "@/hooks/use-categories";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useRecurringTransactions } from "@/hooks/use-recurring-transactions";
import { useSavingsGoals } from "@/hooks/use-savings-goals";
import { useTransactions } from "@/hooks/use-transactions";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { buildSummary } from "@/lib/analytics";
import { buildSavingsProgress, buildSmartAlerts } from "@/lib/phase3";
import { formatDateWithPreferences, formatMoneyWithPreferences } from "@/lib/preferences";
import { buildBudgetProgress, getMonthKey, getPreviousMonthKey } from "@/lib/planning";
import { formatCategoryLabel } from "@/lib/transactions";

const safeCategoryLabel = (value?: string | null) => {
  try {
    return formatCategoryLabel(value);
  } catch {
    return "Uncategorized";
  }
};

const DashboardOverview = () => {
  const navigate = useNavigate();
  const { user, isCheckingAuth } = useRequireAuth("/");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [isRecurringDialogOpen, setIsRecurringDialogOpen] = useState(false);
  const [isSavingsDialogOpen, setIsSavingsDialogOpen] = useState(false);
  const [isPreferencesDialogOpen, setIsPreferencesDialogOpen] = useState(false);

  const transactionsQuery = useTransactions(user?.id);
  const categoriesQuery = useCategories(user?.id);
  const preferencesQuery = useUserPreferences(user?.id);
  const monthKey = getMonthKey();
  const previousMonthKey = getPreviousMonthKey(monthKey);
  const budgetGoalsQuery = useBudgetGoals(user?.id, monthKey);
  const previousBudgetGoalsQuery = useBudgetGoals(user?.id, previousMonthKey);
  const recurringTransactionsQuery = useRecurringTransactions(user?.id);
  const savingsGoalsQuery = useSavingsGoals(user?.id);

  const transactions = useMemo(() => transactionsQuery.data ?? [], [transactionsQuery.data]);
  const currentMonthTransactions = useMemo(
    () => transactions.filter((transaction) => isSameMonth(new Date(transaction.created_at), new Date())),
    [transactions],
  );
  const allTimeSummary = useMemo(() => buildSummary(transactions), [transactions]);
  const monthSummary = useMemo(() => buildSummary(currentMonthTransactions), [currentMonthTransactions]);
  const expenseCategories = useMemo(
    () =>
      (categoriesQuery.data ?? [])
        .filter((category) => category.type === "expense")
        .map((category) => category.name),
    [categoriesQuery.data],
  );
  const budgetProgress = useMemo(
    () => buildBudgetProgress(budgetGoalsQuery.data ?? [], transactions, monthKey, previousBudgetGoalsQuery.data ?? []),
    [budgetGoalsQuery.data, monthKey, previousBudgetGoalsQuery.data, transactions],
  );
  const budgetHighlights = useMemo(() => budgetProgress.slice(0, 3), [budgetProgress]);
  const budgetTotals = useMemo(() => {
    const totalBudget = budgetProgress.reduce((sum, item) => sum + item.monthlyLimit, 0);
    const totalSpent = budgetProgress.reduce((sum, item) => sum + item.spent, 0);

    return {
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
    };
  }, [budgetProgress]);
  const recurringTransactions = useMemo(
    () => recurringTransactionsQuery.data ?? [],
    [recurringTransactionsQuery.data],
  );
  const upcomingRecurring = useMemo(
    () => recurringTransactions.filter((item) => item.is_active).slice(0, 3),
    [recurringTransactions],
  );
  const allSavingsProgress = useMemo(
    () => buildSavingsProgress(savingsGoalsQuery.data ?? []),
    [savingsGoalsQuery.data],
  );
  const preferences = preferencesQuery.data;
  const formatMoney = (value: number) =>
    preferences ? formatMoneyWithPreferences(value, preferences) : formatMoneyWithPreferences(value, {
      preferred_currency: "USD",
      locale: "en-US",
    });
  const formatDate = (value: string | Date, options?: Intl.DateTimeFormatOptions) =>
    preferences ? formatDateWithPreferences(value, preferences, options) : formatDateWithPreferences(value, { locale: "en-US" }, options);
  const savingsProgress = useMemo(() => allSavingsProgress.slice(0, 3), [allSavingsProgress]);
  const smartAlerts = useMemo(
    () =>
      buildSmartAlerts({
        budgetProgress,
        recurringTransactions,
        savingsGoals: allSavingsProgress,
        transactions,
        preferences: preferencesQuery.data,
      }).slice(0, 3),
    [allSavingsProgress, budgetProgress, preferencesQuery.data, recurringTransactions, transactions],
  );
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  if (isCheckingAuth || transactionsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="rounded-3xl border border-border bg-card p-8 text-center text-muted-foreground">
            Loading your dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (transactionsQuery.isError) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="rounded-3xl border border-border bg-card p-8 text-center">
            <h1 className="font-heading text-2xl font-bold text-foreground">Unable to load your dashboard</h1>
            <p className="mt-2 text-muted-foreground">Please refresh and try again.</p>
          </div>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      label: "This Month",
      value: formatMoney(monthSummary.total),
      caption: monthSummary.total >= 0 ? "Net positive so far" : "Spending is ahead",
    },
    {
      label: "Income",
      value: formatMoney(monthSummary.income),
      caption: "Money coming in",
    },
    {
      label: "Expenses",
      value: formatMoney(monthSummary.expenses),
      caption: "Money going out",
    },
    {
      label: "All-Time Balance",
      value: formatMoney(allTimeSummary.total),
      caption: "Your overall running total",
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-20 pb-24 md:pb-12">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="space-y-5">
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/15 via-card to-card p-5 shadow-[var(--shadow-elevated)]"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/60 px-3 py-1 text-xs font-medium text-primary">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Mobile-first overview
                  </div>
                  <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Dashboard</h1>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                    See what matters today, then jump into analytics only when you need deeper reporting.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden shrink-0 sm:inline-flex"
                  onClick={() => navigate("/analytics")}
                >
                  Open Analytics
                </Button>
              </div>

              <div className="rounded-2xl border border-primary/10 bg-background/70 p-4">
                <div className="text-sm text-muted-foreground">Available balance</div>
                <div className="mt-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">
                  {formatMoney(allTimeSummary.total)}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {format(new Date(), "MMMM yyyy")} net:{" "}
                  <span className={monthSummary.total >= 0 ? "text-emerald-500" : "text-rose-500"}>
                    {formatMoney(monthSummary.total)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Button className="h-auto justify-start gap-2 rounded-2xl px-4 py-4" onClick={() => navigate("/add-transaction")}>
                  <Plus className="h-4 w-4" />
                  Add Transaction
                </Button>
                <Button variant="outline" className="h-auto justify-start gap-2 rounded-2xl px-4 py-4" onClick={() => setIsBudgetDialogOpen(true)}>
                  <Target className="h-4 w-4" />
                  Budgets
                </Button>
                <Button variant="outline" className="h-auto justify-start gap-2 rounded-2xl px-4 py-4" onClick={() => setIsSavingsDialogOpen(true)}>
                  <PiggyBank className="h-4 w-4" />
                  Savings
                </Button>
                <Button variant="outline" className="h-auto justify-start gap-2 rounded-2xl px-4 py-4" onClick={() => setIsPreferencesDialogOpen(true)}>
                  <Settings2 className="h-4 w-4" />
                  Preferences
                </Button>
                <Button variant="outline" className="h-auto justify-start gap-2 rounded-2xl px-4 py-4" onClick={() => navigate("/analytics")}>
                  <ArrowRight className="h-4 w-4" />
                  Analytics
                </Button>
              </div>
            </div>
          </motion.section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="text-sm text-muted-foreground">{card.label}</div>
                <div className="mt-2 font-heading text-2xl font-bold text-foreground">{card.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{card.caption}</div>
              </motion.div>
            ))}
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-5">
              <section className="rounded-3xl border border-border bg-card p-5">
                <div className="mb-4">
                  <h2 className="font-heading text-lg font-semibold text-foreground">Smart Alerts</h2>
                  <p className="text-sm text-muted-foreground">The most important budget and planning signals right now.</p>
                </div>
                <div className="space-y-3">
                  {smartAlerts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No alerts yet. Start adding budgets, recurring items, or savings goals to unlock more guidance.
                    </div>
                  ) : (
                    smartAlerts.map((alert) => (
                      <div key={alert.id} className="rounded-2xl border border-border bg-background/60 p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                            <AlertCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{alert.title}</div>
                            <div className="mt-1 text-sm text-muted-foreground">{alert.description}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-foreground">Budget Snapshot</h2>
                    <p className="text-sm text-muted-foreground">Your top category budgets for {format(new Date(), "MMMM yyyy")}.</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setIsBudgetDialogOpen(true)}>
                    Manage
                  </Button>
                </div>

                {budgetProgress.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-5 text-center">
                    <p className="text-sm text-muted-foreground">No monthly budgets yet.</p>
                    <Button variant="outline" className="mt-3" onClick={() => setIsBudgetDialogOpen(true)}>
                      Create Budgets
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-muted/30 p-4">
                        <div className="text-xs text-muted-foreground">Budgeted</div>
                        <div className="mt-1 font-heading text-xl font-bold text-foreground">{formatMoney(budgetTotals.totalBudget)}</div>
                      </div>
                      <div className="rounded-2xl bg-muted/30 p-4">
                        <div className="text-xs text-muted-foreground">Spent</div>
                        <div className="mt-1 font-heading text-xl font-bold text-foreground">{formatMoney(budgetTotals.totalSpent)}</div>
                      </div>
                      <div className="rounded-2xl bg-muted/30 p-4">
                        <div className="text-xs text-muted-foreground">Remaining</div>
                        <div className={`mt-1 font-heading text-xl font-bold ${budgetTotals.remaining >= 0 ? "text-foreground" : "text-rose-500"}`}>
                          {formatMoney(budgetTotals.remaining)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {budgetHighlights.map((item) => (
                        <div key={item.category} className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-medium text-foreground">{safeCategoryLabel(item.category)}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatMoney(item.spent)} of {formatMoney(item.monthlyLimit)}
                              </div>
                              {item.carriedOver > 0 && (
                                <div className="text-xs text-primary">
                                  Includes {formatMoney(item.carriedOver)} rolled over from {format(new Date(`${previousMonthKey}-01T00:00:00`), "MMMM")}
                                </div>
                              )}
                            </div>
                            <div className={`text-sm font-semibold ${item.isOverBudget ? "text-rose-500" : "text-muted-foreground"}`}>
                              {item.progress.toFixed(0)}%
                            </div>
                          </div>
                          <Progress value={item.progress} className={item.isOverBudget ? "[&>div]:bg-rose-500" : ""} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-foreground">Recent Transactions</h2>
                    <p className="text-sm text-muted-foreground">A quick look at your latest activity.</p>
                  </div>
                  <Link to="/analytics" className="text-sm font-medium text-primary hover:underline">
                    View all
                  </Link>
                </div>

                {recentTransactions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                    No transactions yet. Add your first one to start building your dashboard.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTransactions.map((transaction) => (
                      <button
                        key={transaction.id}
                        type="button"
                        onClick={() => navigate(`/transactions/${transaction.id}/edit`)}
                        className="flex w-full items-center justify-between rounded-2xl border border-border bg-background/50 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{safeCategoryLabel(transaction.category)}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(transaction.created_at)}
                            {transaction.description ? ` | ${transaction.description}` : ""}
                          </div>
                        </div>
                        <div className={`ml-3 shrink-0 text-sm font-semibold ${transaction.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                          {transaction.type === "income" ? "+" : "-"}
                          {formatMoney(Math.abs(transaction.amount))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-3xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-foreground">Savings Goals</h2>
                    <p className="text-sm text-muted-foreground">Track the goals you are funding over time.</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setIsSavingsDialogOpen(true)}>
                    Manage
                  </Button>
                </div>

                {savingsProgress.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No savings goals yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savingsProgress.map((goal) => (
                      <div key={goal.id} className="space-y-2 rounded-2xl border border-border bg-background/50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-medium text-foreground">{goal.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatMoney(goal.currentAmount)} of {formatMoney(goal.targetAmount)}
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-muted-foreground">{goal.progress.toFixed(0)}%</div>
                        </div>
                        <Progress value={goal.progress} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-foreground">Upcoming Recurring</h2>
                    <p className="text-sm text-muted-foreground">Bills and income expected soon.</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setIsRecurringDialogOpen(true)}>
                    Manage
                  </Button>
                </div>

                {upcomingRecurring.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No recurring items yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingRecurring.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-border bg-background/50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-foreground">{item.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {safeCategoryLabel(item.category)} | {item.frequency}
                            </div>
                          </div>
                          <div className={`text-sm font-semibold ${item.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                            {item.type === "income" ? "+" : "-"}
                            {formatMoney(item.amount)}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarClock className="h-4 w-4" />
                          Due {formatDate(item.next_occurrence, { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-border bg-card p-5">
                <h2 className="font-heading text-lg font-semibold text-foreground">Quick Management</h2>
                <div className="mt-4 space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setIsCategoryDialogOpen(true)}>
                    <Settings2 className="h-4 w-4" />
                    Manage Categories
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setIsRecurringDialogOpen(true)}>
                    <Repeat className="h-4 w-4" />
                    Manage Recurring
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setIsBudgetDialogOpen(true)}>
                    <Target className="h-4 w-4" />
                    Update Budget Goals
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setIsSavingsDialogOpen(true)}>
                    <Wallet className="h-4 w-4" />
                    Update Savings Goals
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setIsPreferencesDialogOpen(true)}>
                    <Settings2 className="h-4 w-4" />
                    Profile and Preferences
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40"
          onClick={() => navigate("/add-transaction")}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <CategoryManagerDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        userId={user?.id}
      />
      <BudgetGoalsDialog
        open={isBudgetDialogOpen}
        onOpenChange={setIsBudgetDialogOpen}
        userId={user?.id}
        monthKey={monthKey}
        categories={expenseCategories}
      />
      <RecurringTransactionsDialog
        open={isRecurringDialogOpen}
        onOpenChange={setIsRecurringDialogOpen}
        userId={user?.id}
      />
      <SavingsGoalsDialog
        open={isSavingsDialogOpen}
        onOpenChange={setIsSavingsDialogOpen}
        userId={user?.id}
      />
      <UserPreferencesDialog
        open={isPreferencesDialogOpen}
        onOpenChange={setIsPreferencesDialogOpen}
        userId={user?.id}
      />
    </div>
  );
};

export default DashboardOverview;
