import React from "react";

export default function SectionHeader({
  title,
  subtitle,
  action,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "var(--space-4)",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "var(--font-4)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--text-main)",
          }}
        >
          {title} </div>

        {subtitle && (
          <div
            style={{
              fontSize: "var(--font-2)",
              color: "var(--text-sub)",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}
