import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { PlusCircle, MinusCircle, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";


const categories = {
  expense: ["Housing", "Food", "Transport", "Entertainment", "Utilities", "Shopping", "Health", "Other"],
  income: ["Salary", "Freelance", "Investments", "Gifts", "Other"],
};

const AddTransaction = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Please sign in to add transactions");
        navigate("/login");
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) {
      toast.error("Please fill in amount and category.");
      return;
    }
    
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("User not found");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('transactions')
      .insert([
        { 
          amount: parseFloat(amount), 
          category, 
          type,
          user_id: user.id,
          created_at: new Date(date).toISOString()
        }
      ]);

    if (error) {
      console.error(error);
      toast.error("Error adding transaction: " + error.message);
    } else {
      toast.success(`${type === "income" ? "Income" : "Expense"} of $${amount} added!`);
      setAmount("");
      setCategory("");
      setDescription("");
      navigate("/analytics"); // Go to dashboard/analytics after adding
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-1">Add Transaction</h1>
          <p className="text-muted-foreground mb-8">Record a new expense or income.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-[var(--shadow-elevated)]"
        >
          {/* Type Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setType("expense"); setCategory(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
                type === "expense"
                  ? "bg-expense text-expense-foreground shadow-md"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              <MinusCircle className="w-4 h-4" />
              Expense
            </button>
            <button
              onClick={() => { setType("income"); setCategory(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
                type === "income"
                  ? "bg-income text-income-foreground shadow-md"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Income
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount */}
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
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 pl-8 text-lg font-semibold"
                />
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories[type].map((cat) => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            {/* <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11"
              />
            </div> */}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="desc">Description (optional)</Label>
              <Textarea
                id="desc"
                placeholder="What was this for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 font-semibold text-base gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Add {type === "income" ? "Income" : "Expense"}
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddTransaction;
