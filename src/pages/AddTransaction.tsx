import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import TransactionForm from "@/components/transactions/TransactionForm";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAddTransaction } from "@/hooks/use-transactions";
import { buildTransactionPayload } from "@/lib/transactions";

const AddTransaction = () => {
  const navigate = useNavigate();
  const { user, isCheckingAuth } = useRequireAuth("/login");
  const addTransaction = useAddTransaction(user?.id);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <TransactionForm
      title="Add Transaction"
      description="Record a new expense or income."
      submitLabel="Save Transaction"
      isSubmitting={addTransaction.isPending}
      userId={user?.id}
      onSubmit={async (values) => {
        if (!user) {
          toast.error("Please sign in to add transactions.");
          return;
        }

        if (!values.amount || !values.category) {
          toast.error("Please fill in amount and category.");
          return;
        }

        try {
          await addTransaction.mutateAsync(buildTransactionPayload(values, user.id));
          toast.success(`${values.type === "income" ? "Income" : "Expense"} of $${values.amount} added!`);
          navigate("/analytics");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          toast.error(`Error adding transaction: ${message}`);
        }
      }}
    />
  );
};

export default AddTransaction;
