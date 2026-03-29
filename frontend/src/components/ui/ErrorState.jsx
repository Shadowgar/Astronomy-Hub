import React from "react";

export default function ErrorState({
  message = "Something went wrong",
  action = null,
}) {
  return (
    <div role="alert" className="ui-error-state">
      <div>{message}</div>
      {action ? <div className="ui-error-state-action">{action}</div> : null}
    </div>
  );
}
