import React from "react";

export default function LoadingState({
  message = "Loading…",
}) {
  return (
    <div className="ui-loading-state">
      {message}
    </div>
  );
}
