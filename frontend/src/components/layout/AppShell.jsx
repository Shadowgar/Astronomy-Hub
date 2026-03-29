import React from "react";

export default function AppShell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--surface-base)",
        padding: "var(--space-6)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--token-app-max-width)",
          margin: "0 auto",
        }}
      >
        {children} </div> </div>
  );
}
