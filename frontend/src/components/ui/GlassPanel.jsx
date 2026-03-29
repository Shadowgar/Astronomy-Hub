import React from "react";

export default function GlassPanel({
  children,
  className = "",
  variant = "standard",
}) {
  const isHero = variant === "hero";

  return (
    <div
      className={className}
      style={{
        background: "var(--surface-panel)",
        border: "var(--token-border-subtle)",
        borderRadius: isHero ? "var(--radius-xl)" : "var(--radius-lg)",
        padding: isHero ? "var(--space-7)" : "var(--space-6)",
        boxShadow: "var(--token-shadow-lg)",
        transition: "all var(--token-motion-base) var(--token-ease-standard)",
      }}
    >
      {children} </div>
  );
}
