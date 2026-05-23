import React from "react";

export default function ContentGrid({ children, className = "" }) {
  const classes = ["content-grid", className].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      {children} </div>
  );
}
