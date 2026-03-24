import React from "react";

export default function RowItem({
  left,
  right,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "var(--space-3) 0",
      }}
    >
      <div>{left}</div>
      {right && <div>{right}</div>}
    </div>
  );
}
