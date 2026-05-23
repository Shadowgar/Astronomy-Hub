import React from "react";

export default function AppShell({ children }) {
  return (
    <div className="app-shell-root">
      <div className="app-shell-inner">
        {children} </div> </div>
  );
}
