import React from "react";

export default function ContentGrid({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "var(--space-6)",
      }}
    >
      {children} </div>
  );
}
