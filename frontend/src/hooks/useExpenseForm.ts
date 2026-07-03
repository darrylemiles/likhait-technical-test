/**
 * Custom hook for managing expense form state and validation
 */

import { useState } from "react";
import { ExpenseFormData } from "../types";
import {
  formatCurrencyInput,
  getTodayDateString,
  isFutureDate,
  normalizeCurrencyInput,
} from "../utils/expenseUtils";

interface UseExpenseFormProps {
  initialData?: Partial<ExpenseFormData>;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
}

export function useExpenseForm({ initialData, onSubmit }: UseExpenseFormProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: initialData?.amount ? formatCurrencyInput(initialData.amount) : "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    date: initialData?.date || getTodayDateString(),
  });

  const [errors, setErrors] = useState<Partial<ExpenseFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof ExpenseFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ExpenseFormData> = {};
    const normalizedAmount = normalizeCurrencyInput(formData.amount);
    const amount = Number(normalizedAmount);

    if (
      !formData.amount ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      newErrors.amount = "Amount must be greater than 0";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    } else if (isFutureDate(formData.date)) {
      newErrors.date = "Expense date cannot be in the future.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        amount: normalizeCurrencyInput(formData.amount),
      });
      // Reset form on success
      setFormData({
        amount: "",
        description: "",
        category: "",
        date: getTodayDateString(),
      });
      setErrors({});
    } catch (error) {
      console.error("Form submission error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to submit expense";

      if (message.toLowerCase().includes("date")) {
        setErrors((prev) => ({ ...prev, date: message }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: initialData?.amount ? formatCurrencyInput(initialData.amount) : "",
      description: initialData?.description || "",
      category: initialData?.category || "",
      date: initialData?.date || getTodayDateString(),
    });
    setErrors({});
  };

  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    resetForm,
  };
}
