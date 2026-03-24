import React from "react";

export default function TopBar() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "var(--space-6)",
      }}
    >
      <div
        style={{
          fontSize: "var(--font-5)",
          fontWeight: "var(--weight-semibold)",
          color: "var(--text-main)",
        }}
      >
        Astronomy Hub </div>

      <div>
        {/* future controls */}
      </div>
    </div>
  );
}
