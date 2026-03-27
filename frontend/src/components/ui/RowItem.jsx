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
        padding: "var(--space-2) 0",
        width: '100%'
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>{left}</div>
      {right && <div style={{ marginLeft: 'var(--space-3)', flex: '0 0 auto' }}>{right}</div>}
    </div>
  );
}
