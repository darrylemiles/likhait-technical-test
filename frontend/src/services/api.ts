/**
 * API service for communicating with the backend
 */

import { Expense, ExpenseFormData } from "../types";
import { normalizeCurrencyInput } from "../utils/expenseUtils";

const API_BASE_URL = "http://localhost:3000/api";

export interface Category {
  id: number;
  name: string;
}

export function normalizeCategoryName(name: string): string {
  return name.trim();
}

function hasMatchingCategory(categories: Category[], name: string): Category | undefined {
  const normalizedName = normalizeCategoryName(name).toLowerCase();
  return categories.find(
    (category) => normalizeCategoryName(category.name).toLowerCase() === normalizedName,
  );
}

async function getApiErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = await response.json();
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return data.errors.join(", ");
    }
  } catch {
    // Keep fallback error message when response body is not JSON.
  }

  return fallback;
}

/**
 * Fetch all expenses
 */
export async function fetchExpenses(): Promise<Expense[]> {
  const response = await fetch(`${API_BASE_URL}/expenses`);
  if (!response.ok) {
    throw new Error("Failed to fetch expenses");
  }
  return response.json();
}

/**
 * Fetch expenses for a specific year and month
 */
export async function getExpenses(
  year: number,
  month: number,
): Promise<Expense[]> {
  const response = await fetch(
    `${API_BASE_URL}/expenses?year=${year}&month=${month}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch expenses");
  }
  return response.json();
}

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<
  Category[]
> {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  return response.json();
}

/**
 * Create a new category
 */
export async function createCategory(name: string): Promise<Category> {
  const normalizedName = normalizeCategoryName(name);

  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ category: { name: normalizedName } }),
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Failed to create category"));
  }

  return response.json();
}

/**
 * Delete a category
 */
export async function deleteCategory(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Failed to delete category"));
  }
}

/**
 * Create a new expense
 */
export async function createExpense(data: ExpenseFormData): Promise<Expense> {
  // Convert category name to category_id
  const categories = await fetchCategories();
  const category = hasMatchingCategory(categories, data.category);

  if (!category) {
    throw new Error("Category is required");
  }

  const expenseData = {
    description: data.description,
    amount: normalizeCurrencyInput(data.amount),
    category_id: category.id,
    date: data.date,
  };

  const response = await fetch(`${API_BASE_URL}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expense: expenseData }),
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Failed to create expense"));
  }

  return response.json();
}

/**
 * Update an existing expense
 */
export async function updateExpense(
  id: number,
  data: Partial<ExpenseFormData>,
): Promise<Expense> {
  let categoryId: number | undefined;
  if (data.category !== undefined) {
    const categories = await fetchCategories();
    const category = hasMatchingCategory(categories, data.category);

    if (!category) {
      throw new Error("Category is required");
    }

    categoryId = category.id;
  }

  const expenseData = {
    ...(data.description !== undefined && { description: data.description }),
    ...(data.amount !== undefined && {
      amount: normalizeCurrencyInput(data.amount),
    }),
    ...(data.date !== undefined && { date: data.date }),
    ...(categoryId !== undefined && { category_id: categoryId }),
  };

  const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expense: expenseData }),
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Failed to update expense"));
  }

  return response.json();
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete expense");
  }
}
