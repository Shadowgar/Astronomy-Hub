import React from "react";

export default function AppButton({
  children,
  variant = "primary",
}) {
  const isPrimary = variant === "primary";

  return (
    <button
      style={{
        padding: "var(--space-3) var(--space-5)",
        borderRadius: "var(--radius-md)",
        fontSize: "var(--font-3)",
        cursor: "pointer",
        border: "none",
        background: isPrimary
          ? "var(--action-primary-bg)"
          : "var(--surface-panel)",
        color: "var(--text-main)",
      }}
    >
      {children} </button>
  );
}
