import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import TransactionForm from "@/components/transactions/TransactionForm";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useTransaction, useUpdateTransaction } from "@/hooks/use-transactions";
import { buildTransactionPayload, transactionToFormValues } from "@/lib/transactions";

const EditTransaction = () => {
  const navigate = useNavigate();
  const { transactionId } = useParams<{ transactionId: string }>();
  const { user, isCheckingAuth } = useRequireAuth("/login");
  const transactionQuery = useTransaction(user?.id, transactionId);
  const updateTransaction = useUpdateTransaction(user?.id);

  if (isCheckingAuth || transactionQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
            Loading transaction...
          </div>
        </div>
      </div>
    );
  }

  if (!transactionId || transactionQuery.isError || !transactionQuery.data) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Transaction Not Found</h1>
            <p className="text-muted-foreground">We couldn&apos;t load the transaction you wanted to edit.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TransactionForm
      title="Edit Transaction"
      description="Update an existing income or expense entry."
      submitLabel={`Save ${transactionQuery.data.type === "income" ? "Income" : "Expense"}`}
      isSubmitting={updateTransaction.isPending}
      initialValues={transactionToFormValues(transactionQuery.data)}
      onSubmit={async (values) => {
        if (!user) {
          toast.error("Please sign in again.");
          return;
        }

        if (!values.amount || !values.category) {
          toast.error("Please fill in amount and category.");
          return;
        }

        try {
          await updateTransaction.mutateAsync({
            transactionId,
            payload: buildTransactionPayload(values, user.id),
          });

          toast.success("Transaction updated.");
          navigate("/analytics");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          toast.error(`Error updating transaction: ${message}`);
        }
      }}
    />
  );
};

export default EditTransaction;
