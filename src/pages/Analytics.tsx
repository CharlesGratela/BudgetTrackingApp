import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format, subMonths, subDays, startOfMonth, startOfYear, isSameMonth, isAfter } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, ArrowUpDown } from "lucide-react";

import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';


const Analytics = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // Filters
  const [selectedPeriod, setSelectedPeriod] = useState<string>("this-month");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
      }
    };
    checkUser();
    fetchData();
  }, [navigate]);

/*
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
    }
  };
*/

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;


    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setTransactions(data);
    }
  };

  // Derive all unique categories from transactions
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category))).sort();
  }, [transactions]);

  // Calculate Salary Periods + Standard Date Ranges
  const periods = useMemo(() => {
    const incomes = transactions
      .filter(t => t.type === 'income')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const salaryPeriods: { id: string; label: string; start: Date; end: Date | null; type: string }[] = [];
    
    if (incomes.length > 0) {
      // Current Period (from latest income to now)
      const latestIncomeDate = new Date(incomes[0].created_at);
      latestIncomeDate.setHours(0, 0, 0, 0);

      salaryPeriods.push({
        id: "current-salary",
        label: `Current Salary Period (${format(latestIncomeDate, "MMM d")} - Now)`,
        start: latestIncomeDate,
        end: null,
        type: 'salary'
      });

      // Previous Salary Periods
      for (let i = 0; i < incomes.length - 1; i++) {
        const startDate = new Date(incomes[i+1].created_at);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(incomes[i].created_at);
        endDate.setHours(0, 0, 0, 0);

        salaryPeriods.push({
          id: `salary-${i}`,
          label: `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`,
          start: startDate,
          end: endDate,
          type: 'salary'
        });
      }
    }

    return salaryPeriods;
  }, [transactions]);


  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // 1. Time Filter
    const now = new Date();
    if (selectedPeriod === "this-month") {
        filtered = filtered.filter(t => isSameMonth(new Date(t.created_at), now));
    } else if (selectedPeriod === "last-month") {
        const lastMonth = subMonths(now, 1);
        filtered = filtered.filter(t => isSameMonth(new Date(t.created_at), lastMonth));
    } else if (selectedPeriod === "last-30-days") {
        const thirtyDaysAgo = subDays(now, 30);
        filtered = filtered.filter(t => isAfter(new Date(t.created_at), thirtyDaysAgo));
    } else if (selectedPeriod === "this-year") {
        const startOfThisYear = startOfYear(now);
        filtered = filtered.filter(t => isAfter(new Date(t.created_at), startOfThisYear));
    } else if (selectedPeriod === "current-salary" || selectedPeriod.startsWith("salary-")) {
        const period = periods.find(p => p.id === selectedPeriod);
        if (period) {
            filtered = filtered.filter(t => {
                const date = new Date(t.created_at);
                if (period.end) return date >= period.start && date < period.end;
                return date >= period.start;
            });
        }
    } 
    // "all" does nothing

    // 2. Type Filter
    if (typeFilter !== "all") {
        filtered = filtered.filter(t => t.type === typeFilter);
    }

    // 3. Category Filter
    if (categoryFilter !== "all") {
        filtered = filtered.filter(t => t.category === categoryFilter);
    }

    // 4. Sort Order
    filtered.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        const amountA = Number(a.amount);
        const amountB = Number(b.amount);

        switch (sortOrder) {
            case "date-asc": return dateA - dateB;
            case "amount-desc": return amountB - amountA;
            case "amount-asc": return amountA - amountB;
            case "date-desc": 
            default: return dateB - dateA;
        }
    });

    return filtered;
  }, [transactions, selectedPeriod, periods, typeFilter, categoryFilter, sortOrder]);

  const summary = useMemo(() => {
    let inc = 0, exp = 0;
    filteredTransactions.forEach(t => {
      // Logic adjustment: If filtering by expense, income summary should be 0? 
      // Usually summary cards reflect the filtered view.
      if (t.type === 'income') inc += Number(t.amount);
      if (t.type === 'expense') exp += Number(t.amount); // changed from else to explicit check
    });
    return {
      total: inc - exp,
      income: inc,
      expenses: exp
    };
  }, [filteredTransactions]);

  // Chart Data Preparation
  const dailyData = useMemo(() => {
    const map = new Map();
    // Sort strictly by date for the chart
    const sorted = [...filteredTransactions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    sorted.forEach(t => {
        const dateStr = format(new Date(t.created_at), 'MMM dd');
        if (!map.has(dateStr)) {
            map.set(dateStr, { date: dateStr, income: 0, expense: 0 });
        }
        const entry = map.get(dateStr);
        if (t.type === 'income') entry.income += Number(t.amount);
        else if (t.type === 'expense') entry.expense += Number(t.amount);
    });
    return Array.from(map.values());
  }, [filteredTransactions]);

  const categoryData = useMemo(() => {
    const map = new Map();
    filteredTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const cat = t.category || "Uncategorized";
            const val = Number(t.amount);
            map.set(cat, (map.get(cat) || 0) + val);
        });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const COLORS = ['#FF8042', '#00C49F', '#FFBB28', '#0088FE', '#8884d8', '#82ca9d'];

  const summaryCards = [
    { label: "Total Balance", value: `$${summary.total.toFixed(2)}`, icon: DollarSign, trend: "", positive: summary.total >= 0 },
    { label: "Income", value: `$${summary.income.toFixed(2)}`, icon: TrendingUp, trend: "", positive: true },
    { label: "Expenses", value: `$${summary.expenses.toFixed(2)}`, icon: TrendingDown, trend: "", positive: false },
    { label: "Savings", value: `$${(summary.total).toFixed(2)}`, icon: PiggyBank, trend: "", positive: true },
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

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-6 mb-8">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-1">Dashboard</h1>
                <p className="text-muted-foreground">Your financial overview at a glance.</p>
            </motion.div>

            {/* Filter Bar */}
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

                {/* Date Period Filter */}
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
                                    {periods.map(period => (
                                        <SelectItem key={period.id} value={period.id}>
                                            {period.label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </>
                        )}
                    </SelectContent>
                </Select>

                {/* Type Filter */}
                <Select value={typeFilter} onValueChange={(val: "all" | "income" | "expense") => setTypeFilter(val)}>
                    <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="income">Income Only</SelectItem>
                        <SelectItem value="expense">Expenses Only</SelectItem>
                    </SelectContent>
                </Select>

                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                     <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {uniqueCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>
                                <span className="capitalize">{cat}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Sort Order */}
                <Select value={sortOrder} onValueChange={(val: "date-desc" | "date-asc" | "amount-desc" | "amount-asc") => setSortOrder(val)}>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summaryCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-[var(--shadow-elevated)] transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <card.icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-heading font-bold text-foreground">{card.value}</div>
              <span className={`text-xs font-medium ${card.positive ? 'text-income' : 'text-expense'}`}>
                {/* Currently trend is empty, so this will just show "for [period]" */}
                {card.trend && <span className="mr-1">{card.trend}</span>}
                <span className="opacity-80">for {getPeriodLabel()}</span>
              </span>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center shadow-sm mb-8">
            <PiggyBank className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-heading font-semibold text-foreground mb-2">No Data Available</h3>
            <p className="text-muted-foreground">Add income or expenses to see analytics for this period.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            
            {/* Trend Chart (Grouped Bar) */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm col-span-1 lg:col-span-2">
                <h3 className="text-lg font-heading font-semibold mb-4 text-foreground">Income vs Expense Trend</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }}
                                itemStyle={{ color: 'var(--foreground)' }}
                                cursor={{fill: 'var(--muted)', opacity: 0.2}}
                            />
                            <Legend />
                            <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Pie Chart */}
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
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

            {/* Income vs Expense Bar Chart */}
             <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                 <h3 className="text-lg font-heading font-semibold mb-4 text-foreground">Total Comparison</h3>
                 <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{ name: 'Total', income: summary.income, expense: summary.expenses }]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Legend />
                            <Bar dataKey="income" name="Total Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name="Total Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
            </div>
            
          </div>
        )}

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 gap-4">
          {/* Recent Transactions */}
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
              {filteredTransactions.map((tx) => (
                <div 
                  key={tx.id} 
                  onClick={() => setExpandedTxId(expandedTxId === tx.id ? null : tx.id)}
                  className="flex flex-col py-3 border-b border-border last:border-0 hover:bg-muted/30 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {tx.type === "income" ? (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                        )}
                        <p className="text-sm font-medium text-foreground capitalize">{tx.category}</p>
                      </div>
                      
                      <div className="text-xs text-muted-foreground ml-4">
                        {format(new Date(tx.created_at), "MMM d, yyyy")}
                      </div>
                    </div>
                    
                    <span className={`text-sm font-bold ${
                      tx.type === 'income' ? "text-emerald-500" : "text-rose-500"
                    }`}>
                      {tx.type === 'income' ? "+" : "-"}${Math.abs(Number(tx.amount)).toFixed(2)}
                    </span>
                  </div>

                  {/* Expanded Description Area */}
                  {expandedTxId === tx.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 ml-4 pt-2 border-t border-border/50 text-sm text-muted-foreground bg-muted/20 p-3 rounded-md">
                        <span className="font-semibold text-xs uppercase tracking-wider opacity-70 block mb-1">Description</span>
                        {tx.description ? tx.description : 
                          <span className="italic opacity-50">No description provided</span>
                        }
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
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
    </div>
  );
};

export default Analytics;
