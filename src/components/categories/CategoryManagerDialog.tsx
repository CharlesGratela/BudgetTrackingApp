import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAddCategory, useCategories, useDeleteCategory } from "@/hooks/use-categories";
import { formatCategoryLabel, normalizeCategoryName } from "@/lib/transactions";
import type { TransactionType } from "@/types/transactions";

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  defaultType?: TransactionType;
}

const CategoryManagerDialog = ({
  open,
  onOpenChange,
  userId,
  defaultType = "expense",
}: CategoryManagerDialogProps) => {
  const [activeTab, setActiveTab] = useState<TransactionType>(defaultType);
  const [drafts, setDrafts] = useState<Record<TransactionType, string>>({
    expense: "",
    income: "",
  });

  const expenseCategoriesQuery = useCategories(userId, "expense");
  const incomeCategoriesQuery = useCategories(userId, "income");
  const addCategory = useAddCategory(userId);
  const deleteCategory = useDeleteCategory(userId);

  const categoriesByType = useMemo(
    () => ({
      expense: expenseCategoriesQuery.data ?? [],
      income: incomeCategoriesQuery.data ?? [],
    }),
    [expenseCategoriesQuery.data, incomeCategoriesQuery.data],
  );

  const handleAddCategory = async (type: TransactionType) => {
    const draftValue = normalizeCategoryName(drafts[type]);

    if (!draftValue) {
      toast.error("Enter a category name first.");
      return;
    }

    const existingNames = new Set(categoriesByType[type].map((category) => category.name));
    if (existingNames.has(draftValue)) {
      toast.error("That category already exists.");
      return;
    }

    try {
      await addCategory.mutateAsync({ name: draftValue, type });
      setDrafts((currentValue) => ({ ...currentValue, [type]: "" }));
      toast.success(`${formatCategoryLabel(draftValue)} added.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    try {
      await deleteCategory.mutateAsync(categoryId);
      toast.success(`${formatCategoryLabel(categoryName)} removed.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 pt-6 pb-4 pr-12">
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>Add custom income and expense categories for your account.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TransactionType)} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense">Expense</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
            </TabsList>

            {(["expense", "income"] as const).map((type) => (
              <TabsContent key={type} value={type} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={`Add ${type} category`}
                    value={drafts[type]}
                    onChange={(event) =>
                      setDrafts((currentValue) => ({
                        ...currentValue,
                        [type]: event.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    className="gap-2"
                    disabled={addCategory.isPending}
                    onClick={() => handleAddCategory(type)}
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>

                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {categoriesByType[type].map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2"
                    >
                      <span className="text-sm font-medium text-foreground">{formatCategoryLabel(category.name)}</span>
                      {category.isDefault ? (
                        <span className="text-xs text-muted-foreground">Default</span>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-rose-500"
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManagerDialog;
