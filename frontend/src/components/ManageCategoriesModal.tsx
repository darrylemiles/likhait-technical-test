import React from "react";
import { Category, createCategory, deleteCategory, fetchCategories, normalizeCategoryName } from "../services/api";
import { Button, Modal, TextField } from "../vibes";
import { COLORS } from "../constants/colors";

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged?: (categories: Category[]) => void;
  onCategoryDeleted?: (category: Category) => void;
}

export function ManageCategoriesModal({
  isOpen,
  onClose,
  onCategoriesChanged,
  onCategoryDeleted,
}: ManageCategoriesModalProps) {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | undefined>();
  const [success, setSuccess] = React.useState<string | undefined>();

  const loadCategories = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      const categoryData = await fetchCategories();
      setCategories(categoryData);
      onCategoriesChanged?.(categoryData);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to fetch categories";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [onCategoriesChanged]);

  React.useEffect(() => {
    if (isOpen) {
      setNewCategoryName("");
      setSuccess(undefined);
      void loadCategories();
    }
  }, [isOpen, loadCategories]);

  const updateCategories = (nextCategories: Category[]) => {
    setCategories(nextCategories);
    onCategoriesChanged?.(nextCategories);
  };

  const closeWithSuccess = (message: string) => {
    setSuccess(message);
    onClose();
    window.setTimeout(() => {
      window.alert(message);
    }, 0);
  };

  const handleAddCategory = async (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedName = normalizeCategoryName(newCategoryName);
    if (!normalizedName) {
      setError("Category name is required");
      setSuccess(undefined);
      return;
    }

    const duplicate = categories.some(
      (category) =>
        normalizeCategoryName(category.name).toLowerCase() ===
        normalizedName.toLowerCase(),
    );

    if (duplicate) {
      setError("Category already exists");
      setSuccess(undefined);
      return;
    }

    try {
      setIsSaving(true);
      setError(undefined);
      const createdCategory = await createCategory(normalizedName);
      const nextCategories = [...categories, createdCategory].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      updateCategories(nextCategories);
      setNewCategoryName("");
      closeWithSuccess("Category added successfully");
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "Failed to create category";
      setError(message);
      setSuccess(undefined);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    const shouldDelete = window.confirm(
      "Deleting this category will also delete all expenses under this category. Are you sure you want to continue?",
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(category.id);
      setError(undefined);
      await deleteCategory(category.id);
      const nextCategories = categories.filter((item) => item.id !== category.id);
      updateCategories(nextCategories);
      onCategoryDeleted?.(category);
      closeWithSuccess("Category deleted successfully");
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete category";
      setError(message);
      setSuccess(undefined);
    } finally {
      setDeletingId(null);
    }
  };

  const formStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.5rem",
    alignItems: "flex-end",
    marginBottom: "1rem",
  };

  const listStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    maxHeight: "320px",
    overflowY: "auto",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    padding: "0.75rem",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "0.5rem",
    backgroundColor: COLORS.background.main,
  };

  const feedbackStyle = (color: string): React.CSSProperties => ({
    color,
    fontSize: "0.875rem",
    marginBottom: "0.75rem",
  });

  const emptyStyle: React.CSSProperties = {
    padding: "1rem",
    color: COLORS.text.secondary,
    textAlign: "center",
    border: `1px dashed ${COLORS.border}`,
    borderRadius: "0.5rem",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Categories"
      maxWidth="560px"
    >
      <form onSubmit={handleAddCategory} style={formStyle}>
        <TextField
          label="New Category"
          placeholder="Enter category name"
          value={newCategoryName}
          onChange={(event) => setNewCategoryName(event.target.value)}
          fullWidth
        />
        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving ? "Adding..." : "Add"}
        </Button>
      </form>

      {error && <div style={feedbackStyle(COLORS.danger)}>{error}</div>}
      {success && <div style={feedbackStyle(COLORS.success)}>{success}</div>}

      {isLoading ? (
        <div style={emptyStyle}>Loading categories...</div>
      ) : categories.length === 0 ? (
        <div style={emptyStyle}>No categories yet.</div>
      ) : (
        <div style={listStyle}>
          {categories.map((category) => (
            <div key={category.id} style={rowStyle}>
              <span>{category.name}</span>
              <Button
                type="button"
                variant="danger"
                size="small"
                disabled={deletingId === category.id}
                onClick={() => {
                  void handleDeleteCategory(category);
                }}
              >
                {deletingId === category.id ? "Deleting..." : "Delete"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
