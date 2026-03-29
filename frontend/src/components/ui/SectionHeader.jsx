import React from "react";

export default function SectionHeader({
  title,
  subtitle,
  action,
}) {
  return (
    <div className="ui-section-header">
      <div>
        <div className="ui-section-header-title">
          {title} </div>

        {subtitle && (
          <div className="ui-section-header-subtitle">
            {subtitle}
          </div>
        )}
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}
