import React from "react";

export default function AppButton({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  ...buttonProps
}) {
  const isPrimary = variant === "primary";
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={loading || undefined}
      style={{
        padding: "var(--space-3) var(--space-5)",
        borderRadius: "var(--radius-md)",
        fontSize: "var(--font-3)",
        cursor: isDisabled ? "not-allowed" : "pointer",
        border: "none",
        background: isPrimary
          ? "var(--action-primary-bg)"
          : "var(--surface-panel)",
        color: "var(--text-main)",
        opacity: isDisabled ? 0.65 : 1,
        transition: "opacity var(--token-motion-fast) var(--token-ease-standard), transform var(--token-motion-fast) var(--token-ease-standard)",
      }}
      {...buttonProps}
    >
      {children} </button>
  );
}
