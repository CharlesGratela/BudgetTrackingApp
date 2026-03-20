import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, MinusCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_TRANSACTION_CATEGORIES } from "@/lib/transactions";
import type { TransactionFormValues, TransactionType } from "@/types/transactions";

const getDefaultValues = (): TransactionFormValues => ({
  type: "expense",
  amount: "",
  category: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
});

interface TransactionFormProps {
  title: string;
  description: string;
  submitLabel: string;
  isSubmitting?: boolean;
  initialValues?: TransactionFormValues;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
}

const TransactionForm = ({
  title,
  description,
  submitLabel,
  isSubmitting = false,
  initialValues,
  onSubmit,
}: TransactionFormProps) => {
  const [values, setValues] = useState<TransactionFormValues>(initialValues ?? getDefaultValues());

  useEffect(() => {
    if (initialValues) {
      setValues(initialValues);
    }
  }, [initialValues]);

  const availableCategories = useMemo(
    () => DEFAULT_TRANSACTION_CATEGORIES[values.type],
    [values.type],
  );

  const handleTypeChange = (type: TransactionType) => {
    setValues((currentValues) => ({
      ...currentValues,
      type,
      category: "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(values);
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-1">{title}</h1>
          <p className="text-muted-foreground mb-8">{description}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-[var(--shadow-elevated)]"
        >
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => handleTypeChange("expense")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
                values.type === "expense"
                  ? "bg-expense text-expense-foreground shadow-md"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              <MinusCircle className="w-4 h-4" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
                values.type === "income"
                  ? "bg-income text-income-foreground shadow-md"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Income
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={values.amount}
                  onChange={(event) => setValues((currentValues) => ({ ...currentValues, amount: event.target.value }))}
                  className="h-12 pl-8 text-lg font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={values.date}
                onChange={(event) => setValues((currentValues) => ({ ...currentValues, date: event.target.value }))}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={values.category}
                onValueChange={(category) => setValues((currentValues) => ({ ...currentValues, category }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description (optional)</Label>
              <Textarea
                id="desc"
                placeholder="What was this for?"
                value={values.description}
                onChange={(event) =>
                  setValues((currentValues) => ({ ...currentValues, description: event.target.value }))
                }
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-semibold text-base gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {submitLabel}
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default TransactionForm;
