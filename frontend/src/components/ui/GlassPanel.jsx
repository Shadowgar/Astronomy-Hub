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
        border: "1px solid var(--surface-border)",
        borderRadius: isHero ? "var(--radius-xl)" : "var(--radius-lg)",
        padding: isHero ? "var(--space-7)" : "var(--space-6)",
        boxShadow: "0 10px 30px var(--effect-glow-soft)",
        transition: "all var(--dur-base) var(--ease-standard)",
      }}
    >
      {children} </div>
  );
}
