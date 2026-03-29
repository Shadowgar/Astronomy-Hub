import React from "react";

export default function CommandBar({
  children,
  className = "",
}) {
  const classes = ["ui-command-bar", className].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      {children}
    </div>
  );
}
