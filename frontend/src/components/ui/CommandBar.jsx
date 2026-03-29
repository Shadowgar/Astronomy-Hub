import React from "react";

export default function CommandBar({
  children,
  className = "",
}) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-2) 0",
      }}
    >
      {children}
    </div>
  );
}
