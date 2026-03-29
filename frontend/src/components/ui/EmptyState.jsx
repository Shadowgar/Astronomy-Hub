import React from "react";

export default function EmptyState({
  message = "No data available",
  action = null,
}) {
  return (
    <div
      style={{
        color: "var(--text-sub)",
        padding: "var(--space-3) 0",
      }}
    >
      <div>{message}</div>
      {action ? <div style={{ marginTop: "var(--space-2)" }}>{action}</div> : null}
    </div>
  );
}
