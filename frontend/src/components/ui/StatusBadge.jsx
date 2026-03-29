import React from "react";

export default function StatusBadge({
  label,
  variant = "neutral",
}) {
  let bg = "var(--surface-panel)";
  let color = "var(--text-main)";

  if (variant === "good") {
    bg = "var(--status-good-bg)";
    color = "var(--text-main)";
  }

  return (
    <span
      style={{
        padding: "var(--token-badge-padding-y) var(--token-badge-padding-x)",
        borderRadius: "var(--token-radius-pill)",
        fontSize: "var(--token-font-2)",
        background: bg,
        color: color,
        display: "inline-block",
      }}
    >
      {label} </span>
  );
}
