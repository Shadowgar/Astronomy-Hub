import React from "react";
import GlassPanel from "./GlassPanel";

export default function Panel({
  children,
  className = "",
  variant = "standard",
}) {
  return (
    <GlassPanel className={className} variant={variant}>
      {children}
    </GlassPanel>
  );
}
