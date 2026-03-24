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
        padding: "4px 10px",
        borderRadius: "var(--radius-pill)",
        fontSize: "var(--font-2)",
        background: bg,
        color: color,
        display: "inline-block",
      }}
    >
      {label} </span>
  );
}
