import React from "react";

export default function StatusBadge({
  label,
  variant = "neutral",
}) {
  const classNames = ["ui-status-badge", variant === "good" ? "ui-status-badge-good" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classNames}>
      {label} </span>
  );
}
