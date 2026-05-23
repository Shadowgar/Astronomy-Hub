import React from "react";

export default function EmptyState({
  message = "No data available",
  action = null,
}) {
  return (
    <div className="ui-empty-state">
      <div>{message}</div>
      {action ? <div className="ui-empty-state-action">{action}</div> : null}
    </div>
  );
}
