import React from "react";

export default function ErrorState({
  message = "Something went wrong",
  action = null,
}) {
  return (
    <div
      role="alert"
      style={{
        color: "var(--token-color-danger)",
        padding: "var(--space-3) 0",
      }}
    >
      <div>{message}</div>
      {action ? <div style={{ marginTop: "var(--space-2)" }}>{action}</div> : null}
    </div>
  );
}
