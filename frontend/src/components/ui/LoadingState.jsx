import React from "react";

export default function LoadingState({
  message = "Loading…",
}) {
  return (
    <div
      style={{
        color: "var(--text-sub)",
        padding: "var(--space-3) 0",
      }}
    >
      {message}
    </div>
  );
}
