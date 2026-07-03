import React, { useEffect, useMemo, useRef, useState } from "react";
import { COLORS } from "../constants/colors";
import { FormControl } from "../vibes";
import { Category, normalizeCategoryName } from "../services/api";

interface CategoryAutocompleteProps {
  categories: Category[];
  value: string;
  error?: string;
  required?: boolean;
  helperText?: string;
  onChange: (value: string) => void;
}

export function CategoryAutocomplete({
  categories,
  value,
  error,
  required,
  helperText = "Select from the options or type a new category.",
  onChange,
}: CategoryAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const query = normalizeCategoryName(value).toLowerCase();
    if (!query) {
      return categories;
    }

    return categories.filter((category) =>
      normalizeCategoryName(category.name).toLowerCase().includes(query),
    );
  }, [categories, value]);

  const normalizedValue = normalizeCategoryName(value);
  const exactMatch = useMemo(
    () =>
      categories.find(
        (category) =>
          normalizeCategoryName(category.name).toLowerCase() ===
          normalizedValue.toLowerCase(),
      ),
    [categories, normalizedValue],
  );
  const canCreateCategory = normalizedValue.length > 0 && !exactMatch;
  const optionCount = filteredCategories.length + (canCreateCategory ? 1 : 0);

  useEffect(() => {
    setHighlightedIndex(optionCount > 0 ? 0 : -1);
  }, [optionCount, value]);

  const hasValue = value.trim().length > 0;

  const inputStyle: React.CSSProperties = {
    padding: "0.625rem 2.25rem 0.625rem 0.75rem",
    fontSize: "1rem",
    border: `1px solid ${error ? COLORS.danger : COLORS.border}`,
    borderRadius: "0.375rem",
    outline: "none",
    transition: "border-color 0.2s",
    backgroundColor: COLORS.background.main,
    color: COLORS.text.primary,
    width: "100%",
    boxSizing: "border-box",
  };

  const inputWrapperStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
  };

  const clearButtonStyle: React.CSSProperties = {
    position: "absolute",
    right: "0.5rem",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: COLORS.secondary.s02,
    color: COLORS.text.secondary,
    cursor: "pointer",
    width: "1.5rem",
    height: "1.5rem",
    borderRadius: "999px",
    fontSize: "1rem",
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const helperTextStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    color: COLORS.text.secondary,
    marginTop: "0.375rem",
  };

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    zIndex: 20,
    marginTop: "0.25rem",
    width: "100%",
    backgroundColor: COLORS.background.main,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "0.5rem",
    boxShadow: "0 8px 16px rgba(70, 67, 67, 0.12)",
    maxHeight: "220px",
    overflowY: "auto",
    padding: "0.25rem",
    boxSizing: "border-box",
  };

  const itemStyle: React.CSSProperties = {
    padding: "0.625rem 0.75rem",
    borderRadius: "0.25rem",
    cursor: "pointer",
    color: COLORS.text.primary,
    fontSize: "0.95rem",
  };

  const noResultsStyle: React.CSSProperties = {
    padding: "0.75rem",
    color: COLORS.text.secondary,
    fontSize: "0.875rem",
  };

  const createOptionStyle: React.CSSProperties = {
    ...itemStyle,
    border: `1px dashed ${COLORS.primary.p04}`,
    color: COLORS.primary.p07,
    fontWeight: 700,
    marginTop: filteredCategories.length === 0 ? 0 : "0.25rem",
  };

  const handleSelect = (name: string) => {
    onChange(name);
    setIsOpen(false);
  };

  const handleStageNewCategory = () => {
    const normalizedName = normalizeCategoryName(value);
    if (!normalizedName) {
      return;
    }

    const matchingCategory = categories.find(
      (category) =>
        normalizeCategoryName(category.name).toLowerCase() ===
        normalizedName.toLowerCase(),
    );

    if (matchingCategory) {
      handleSelect(matchingCategory.name);
      return;
    }

    handleSelect(normalizedName);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const selectHighlightedOption = () => {
    if (highlightedIndex >= 0 && highlightedIndex < filteredCategories.length) {
      handleSelect(filteredCategories[highlightedIndex].name);
      return;
    }

    if (canCreateCategory && highlightedIndex === filteredCategories.length) {
      handleStageNewCategory();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        optionCount === 0 ? -1 : (current + 1) % optionCount,
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        optionCount === 0 ? -1 : (current - 1 + optionCount) % optionCount,
      );
    }

    if (event.key === "Enter" && isOpen && highlightedIndex >= 0) {
      event.preventDefault();
      selectHighlightedOption();
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <FormControl label="Category" error={error} required={required} fullWidth>
      <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
        <div style={inputWrapperStyle}>
          <input
            type="text"
            value={value}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              onChange(event.target.value);
              if (!isOpen) {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            style={inputStyle}
            placeholder="Search or create a category"
            autoComplete="off"
            required={required}
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
          />
          {hasValue && (
            <button
              type="button"
              aria-label="Clear category"
              title="Clear category"
              style={clearButtonStyle}
              onClick={handleClear}
            >
              ×
            </button>
          )}
        </div>

        {helperText && <div style={helperTextStyle}>{helperText}</div>}

        {isOpen && (
          <div style={dropdownStyle} role="listbox">
            {filteredCategories.length === 0 && (
              <div style={noResultsStyle}>No categories found.</div>
            )}

            {filteredCategories.length > 0 &&
              filteredCategories.map((category, index) => (
                <div
                  key={category.id}
                  role="option"
                  aria-selected={category.name === value}
                  style={{
                    ...itemStyle,
                    backgroundColor:
                      index === highlightedIndex ||
                      normalizeCategoryName(category.name).toLowerCase() ===
                        normalizeCategoryName(value).toLowerCase()
                        ? COLORS.background.hover
                        : "transparent",
                    fontWeight:
                      normalizeCategoryName(category.name).toLowerCase() ===
                      normalizeCategoryName(value).toLowerCase()
                        ? 700
                        : 400,
                  }}
                  onClick={() => handleSelect(category.name)}
                  onMouseEnter={(event) => {
                    setHighlightedIndex(index);
                    event.currentTarget.style.backgroundColor =
                      COLORS.background.hover;
                  }}
                >
                  {category.name}
                </div>
              ))}

            {canCreateCategory && (
              <div
                role="option"
                aria-selected={highlightedIndex === filteredCategories.length}
                style={{
                  ...createOptionStyle,
                  backgroundColor:
                    highlightedIndex === filteredCategories.length
                      ? COLORS.primary.p01
                      : COLORS.background.main,
                }}
                onClick={handleStageNewCategory}
                onMouseEnter={() => setHighlightedIndex(filteredCategories.length)}
              >
                {`Use new category “${normalizedValue}”`}
              </div>
            )}
          </div>
        )}
      </div>
    </FormControl>
  );
}
