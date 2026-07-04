/**
 * Form component for adding/editing expenses
 */

import React from "react";
import { ExpenseFormData } from "../types";
import { TextField, Button } from "../vibes";
import { useExpenseForm } from "../hooks/useExpenseForm";
import { CategoryAutocomplete } from "./CategoryAutocomplete";
import {
  Category,
  createCategory,
  fetchCategories,
  normalizeCategoryName,
} from "../services/api";
import { ManageCategoriesModal } from "./ManageCategoriesModal";
import { formatCurrencyInput, getTodayDateString } from "../utils/expenseUtils";

interface ExpenseFormProps {
  initialData?: Partial<ExpenseFormData>;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function ExpenseForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Add Expense",
}: ExpenseFormProps) {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [categoryError, setCategoryError] = React.useState<string | undefined>();
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] =
    React.useState(false);
  const today = getTodayDateString();

  const loadCategories = React.useCallback(async () => {
    try {
      const categoryData = await fetchCategories();
      setCategories(categoryData);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  React.useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const resolveCategoryName = React.useCallback(
    async (name: string): Promise<string> => {
      const normalized = normalizeCategoryName(name);

      if (!normalized) {
        throw new Error("Category is required");
      }

      const existing = categories.find(
        (category) =>
          normalizeCategoryName(category.name).toLowerCase() ===
          normalized.toLowerCase(),
      );

      if (existing) {
        return existing.name;
      }

      const createdCategory = await createCategory(normalized);
      setCategories((prev) =>
        [...prev, createdCategory].sort((a, b) => a.name.localeCompare(b.name)),
      );
      return createdCategory.name;
    },
    [categories],
  );

  const submitWithCategory = React.useCallback(
    async (data: ExpenseFormData): Promise<void> => {
      setCategoryError(undefined);

      const categoryName = await resolveCategoryName(data.category).catch(
        (error) => {
          const message =
            error instanceof Error ? error.message : "Failed to save category";
          setCategoryError(message);
          throw error;
        },
      );

      try {
        await onSubmit({ ...data, category: categoryName });
      } catch (error) {
        throw error;
      }
    },
    [onSubmit, resolveCategoryName],
  );

  const { formData, errors, isSubmitting, handleChange, handleSubmit } =
    useExpenseForm({
      initialData,
      onSubmit: submitWithCategory,
    });

  const formStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.5rem",
    flexWrap: "wrap",
    justifyContent: "flex-end"
  };

  const handleCategoryChange = (value: string) => {
    setCategoryError(undefined);
    handleChange("category", value);
  };

  const handleCategoryDeleted = (category: Category) => {
    if (
      normalizeCategoryName(formData.category).toLowerCase() ===
      normalizeCategoryName(category.name).toLowerCase()
    ) {
      handleCategoryChange("");
      setCategoryError("Category is required");
    }
  };

  const handleAmountBlur = () => {
    handleChange("amount", formatCurrencyInput(formData.amount));
  };

  return (
    <>
      <form onSubmit={handleSubmit} style={formStyle}>
        <TextField
          label="Amount ($)"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={formData.amount}
          onChange={(e) => handleChange("amount", e.target.value)}
          onBlur={handleAmountBlur}
          error={errors.amount}
          fullWidth
          required
        />

        <TextField
          label="Description"
          type="text"
          placeholder="Enter description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          error={errors.description}
          fullWidth
          required
        />

        <CategoryAutocomplete
          categories={categories}
          value={formData.category}
          onChange={handleCategoryChange}
          error={categoryError || errors.category}
          required
        />

        <TextField
          label="Date"
          type="date"
          value={formData.date}
          onChange={(e) => handleChange("date", e.target.value)}
          error={errors.date}
          max={today}
          title="Future dates cannot be used for expenses."
          fullWidth
          required
        />

        <div style={buttonGroupStyle}>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : submitLabel}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        onCategoriesChanged={setCategories}
        onCategoryDeleted={handleCategoryDeleted}
      />
    </>
  );
}
