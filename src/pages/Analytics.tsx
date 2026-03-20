import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowUpDown, ChevronDown, Download, Edit2, Filter, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useDeleteTransaction, useTransactions } from "@/hooks/use-transactions";
import {
  buildCategoryData,
  buildDailyData,
  buildInsights,
  buildSummary,
  escapeCsvValue,
  filterTransactions,
  getSalaryPeriods,
  getUniqueCategories,
} from "@/lib/analytics";
import { formatCurrency } from "@/lib/transactions";
import type { TransactionFilters } from "@/types/transactions";
import { DollarSign, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#FF8042", "#00C49F", "#FFBB28", "#0088FE", "#8884d8", "#82ca9d"];

const Analytics = () => {
  const navigate = useNavigate();
  const { user, isCheckingAuth } = useRequireAuth("/");
  const transactionsQuery = useTransactions(user?.id);
  const deleteTransaction = useDeleteTransaction(user?.id);
  const transactions = useMemo(() => transactionsQuery.data ?? [], [transactionsQuery.data]);

  const [selectedPeriod, setSelectedPeriod] = useState<string>("this-month");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    setVisibleCount(10);
  }, [selectedPeriod, typeFilter, categoryFilter, sortOrder]);

  const uniqueCategories = useMemo(() => getUniqueCategories(transactions), [transactions]);
  const periods = useMemo(() => getSalaryPeriods(transactions), [transactions]);

  const filteredTransactions = useMemo(() => {
    const filters: TransactionFilters = {
      selectedPeriod,
      typeFilter,
      categoryFilter,
      sortOrder,
    };

    return filterTransactions(transactions, filters, periods);
  }, [transactions, selectedPeriod, typeFilter, categoryFilter, sortOrder, periods]);

  const summary = useMemo(() => buildSummary(filteredTransactions), [filteredTransactions]);
  const dailyData = useMemo(() => buildDailyData(filteredTransactions), [filteredTransactions]);
  const categoryData = useMemo(() => buildCategoryData(filteredTransactions), [filteredTransactions]);
  const insights = useMemo(() => buildInsights(filteredTransactions), [filteredTransactions]);

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Date", "Type", "Category", "Amount", "Description"];
    const csvData = filteredTransactions.map((transaction) =>
      [
        escapeCsvValue(format(new Date(transaction.created_at), "yyyy-MM-dd")),
        escapeCsvValue(transaction.type),
        escapeCsvValue(transaction.category),
        escapeCsvValue(transaction.amount),
        escapeCsvValue(transaction.description),
      ].join(","),
    );

    const csvContent = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `budget_export_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Exported successfully!");
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    try {
      await deleteTransaction.mutateAsync(transactionId);
      toast.success("Transaction deleted");
    } catch {
      toast.error("Failed to delete transaction");
    }
  };

  const summaryCards = [
    { label: "Total Balance", value: formatCurrency(summary.total), icon: DollarSign, trend: "", positive: summary.total >= 0 },
    { label: "Income", value: formatCurrency(summary.income), icon: TrendingUp, trend: "", positive: true },
    { label: "Expenses", value: formatCurrency(summary.expenses), icon: TrendingDown, trend: "", positive: false },
    { label: "Savings", value: formatCurrency(summary.total), icon: PiggyBank, trend: "", positive: true },
  ];

  const getPeriodLabel = () => {
    if (selectedPeriod === "this-month") return "this month";
    if (selectedPeriod === "last-month") return "last month";
    if (selectedPeriod === "last-30-days") return "the last 30 days";
    if (selectedPeriod === "this-year") return "this year";
    if (selectedPeriod === "all") return "all time";
    if (selectedPeriod.startsWith("salary-") || selectedPeriod === "current-salary") return "this salary period";
    return "this period";
  };

  if (isCheckingAuth || transactionsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-24 md:pb-12 relative">
        <div className="container mx-auto px-4">
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
            Loading analytics...
          </div>
        </div>
      </div>
    );
  }

  if (transactionsQuery.isError) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-24 md:pb-12 relative">
        <div className="container mx-auto px-4">
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Unable to Load Analytics</h1>
            <p className="text-muted-foreground">Please try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-24 md:pb-12 relative">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-1">Dashboard</h1>
            <p className="text-muted-foreground">Your financial overview at a glance.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-wrap items-center gap-3 bg-card border border-border p-4 rounded-xl shadow-sm"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mr-auto">
              <Filter className="w-4 h-4" />
              Filters:
            </div>

            <Button variant="outline" size="sm" onClick={exportToCSV} className="hidden md:flex gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px] md:w-[240px]">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Calendar Presets</SelectLabel>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectGroup>
                {periods.length > 0 && (
                  <>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Salary Periods</SelectLabel>
                      {periods.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </>
                )}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value: "all" | "income" | "expense") => setTypeFilter(value)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income Only</SelectItem>
                <SelectItem value="expense">Expenses Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    <span className="capitalize">{category}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sortOrder}
              onValueChange={(value: "date-desc" | "date-asc" | "amount-desc" | "amount-asc") => setSortOrder(value)}
            >
              <SelectTrigger className="w-[160px]">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                  <SelectValue placeholder="Sort" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="amount-desc">Amount: High to Low</SelectItem>
                <SelectItem value="amount-asc">Amount: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        </div>

        {insights.topCategory && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              Insight: Your biggest expense this period is{" "}
              <span className="font-bold capitalize">{insights.topCategory}</span> at{" "}
              <span className="font-bold">{formatCurrency(insights.topAmount)}</span>.
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summaryCards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-[var(--shadow-elevated)] transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <card.icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-heading font-bold text-foreground">{card.value}</div>
              <span className={`text-xs font-medium ${card.positive ? "text-income" : "text-expense"}`}>
                {card.trend && <span className="mr-1">{card.trend}</span>}
                <span className="opacity-80">for {getPeriodLabel()}</span>
              </span>
            </motion.div>
          ))}
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center shadow-sm mb-8">
            <PiggyBank className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-heading font-semibold text-foreground mb-2">No Data Available</h3>
            <p className="text-muted-foreground">Add income or expenses to see analytics for this period.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm col-span-1 lg:col-span-2">
              <h3 className="text-lg font-heading font-semibold mb-4 text-foreground">Income vs Expense Trend</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                      }}
                      itemStyle={{ color: "var(--foreground)" }}
                    />
                    <Area type="monotone" dataKey="income" stroke="#10B981" fillOpacity={1} fill="url(#colorIncome)" name="Income" />
                    <Area type="monotone" dataKey="expense" stroke="#EF4444" fillOpacity={1} fill="url(#colorExpense)" name="Expense" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-heading font-semibold mb-4 text-foreground">Expense Distribution</h3>
              <div className="h-[300px] w-full flex justify-center">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground h-full">
                    <p>No expense data in this period.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-heading font-semibold mb-4 text-foreground">Total Comparison</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: "Total", income: summary.income, expense: summary.expenses }]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Legend />
                    <Bar dataKey="income" name="Total Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Total Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-foreground">Transactions List</h3>
              <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">
                {filteredTransactions.length} found
              </span>
            </div>

            <div className="space-y-3">
              {filteredTransactions.slice(0, visibleCount).map((transaction) => (
                <div
                  key={transaction.id}
                  onClick={() => setExpandedTxId(expandedTxId === transaction.id ? null : transaction.id)}
                  className="flex flex-col py-3 border-b border-border last:border-0 hover:bg-muted/30 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {transaction.type === "income" ? (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                        )}
                        <p className="text-sm font-medium text-foreground capitalize">{transaction.category}</p>
                      </div>

                      <div className="text-xs text-muted-foreground ml-4">
                        {format(new Date(transaction.created_at), "MMM d, yyyy")}
                      </div>
                    </div>

                    <span className={`text-sm font-bold ${transaction.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                  </div>

                  {expandedTxId === transaction.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 ml-4 pt-2 border-t border-border/50 text-sm text-muted-foreground bg-muted/20 p-3 rounded-md flex justify-between items-start gap-4">
                        <div>
                          <span className="font-semibold text-xs uppercase tracking-wider opacity-70 block mb-1">Description</span>
                          {transaction.description ? (
                            transaction.description
                          ) : (
                            <span className="italic opacity-50">No description provided</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/transactions/${transaction.id}/edit`);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-rose-500"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(transaction.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}

              {filteredTransactions.length > visibleCount && (
                <Button variant="ghost" className="w-full mt-4 text-muted-foreground" onClick={() => setVisibleCount((previousValue) => previousValue + 10)}>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Load More
                </Button>
              )}

              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                  <Filter className="w-8 h-8 opacity-20" />
                  <p>No transactions match your filters.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
          onClick={() => navigate("/add-transaction")}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default Analytics;
