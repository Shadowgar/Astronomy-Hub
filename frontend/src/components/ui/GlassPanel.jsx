import React from "react";

export default function GlassPanel({
  children,
  className = "",
  variant = "standard",
}) {
  const isHero = variant === "hero";
  const classes = ["ui-glass-panel", isHero ? "ui-glass-panel-hero" : "ui-glass-panel-standard", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {children} </div>
  );
}
