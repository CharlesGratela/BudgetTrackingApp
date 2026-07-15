import { useEffect, useMemo, useState } from "react";
import type { TransactionFilters, TransactionType } from "@/types/transactions";

/**
 * Owns the Analytics screen's filter state (period, type, category, sort, search,
 * amount/date ranges), the derived TransactionFilters object, the row-expansion
 * and pagination state, and the "reset visible count when filters change" effect.
 * Extracted from the Analytics page to keep that component focused on rendering.
 */
export const useAnalyticsFilters = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("this-month");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    setVisibleCount(10);
  }, [selectedPeriod, typeFilter, categoryFilter, sortOrder, searchQuery, minAmount, maxAmount, customStartDate, customEndDate]);

  const filters: TransactionFilters = useMemo(
    () => ({
      selectedPeriod,
      typeFilter,
      categoryFilter,
      sortOrder,
      searchQuery,
      minAmount,
      maxAmount,
      customStartDate,
      customEndDate,
    }),
    [selectedPeriod, typeFilter, categoryFilter, sortOrder, searchQuery, minAmount, maxAmount, customStartDate, customEndDate],
  );

  const resetAdvancedFilters = () => {
    setSearchQuery("");
    setMinAmount("");
    setMaxAmount("");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  return {
    selectedPeriod,
    setSelectedPeriod,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,
    sortOrder,
    setSortOrder,
    searchQuery,
    setSearchQuery,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    expandedTxId,
    setExpandedTxId,
    visibleCount,
    setVisibleCount,
    filters,
    resetAdvancedFilters,
  };
};
