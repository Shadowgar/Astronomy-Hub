import React from "react";

export default function AppButton({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  ...buttonProps
}) {
  const isPrimary = variant === "primary";
  const isDisabled = disabled || loading;
  const classNames = [
    "ui-app-button",
    isPrimary ? "ui-app-button-primary" : "ui-app-button-secondary",
    isDisabled ? "ui-app-button-disabled" : "",
    buttonProps.className || "",
  ]
    .filter(Boolean)
    .join(" ");
  const { className: _ignoredClassName, ...restButtonProps } = buttonProps;

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={classNames}
      {...restButtonProps}
    >
      {children} </button>
  );
}
