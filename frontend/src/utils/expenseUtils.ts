/**
 * Utility functions for expense calculations and data manipulation
 */

import { Expense } from "../types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Calculate total amount from an array of expenses
 */
export function calculateTotal(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

/**
 * Strip display-only currency formatting before validation or API submission.
 */
export function normalizeCurrencyInput(value: string): string {
  return value.replace(/[$,\s]/g, "");
}

/**
 * Format an amount for editable form fields without adding the currency symbol.
 */
export function formatCurrencyInput(value: string): string {
  const normalizedValue = normalizeCurrencyInput(value);

  if (!normalizedValue) {
    return "";
  }

  const amount = Number(normalizedValue);

  if (!Number.isFinite(amount)) {
    return value;
  }

  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in the user's local timezone.
 */
export function getTodayDateString(): string {
  return formatDate(new Date());
}

/**
 * Check whether a YYYY-MM-DD date string is after today.
 */
export function isFutureDate(date: string): boolean {
  return date > getTodayDateString();
}

/**
 * Get days in month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Group expenses by day
 */
export function groupExpensesByDay(expenses: Expense[]) {
  const grouped = new Map<number, Expense[]>();

  expenses.forEach((expense) => {
    const day = new Date(expense.date).getDate();
    const dayExpenses = grouped.get(day) || [];
    dayExpenses.push(expense);
    grouped.set(day, dayExpenses);
  });

  return grouped;
}
