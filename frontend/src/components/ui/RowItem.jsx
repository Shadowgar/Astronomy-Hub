import React from "react";

export default function RowItem({
  left,
  right,
}) {
  return (
    <div className="ui-row-item">
      <div className="ui-row-item-left">{left}</div>
      {right && <div className="ui-row-item-right">{right}</div>}
    </div>
  );
}
