const variantClassMap = {
  primary: "ui-button-primary",
  secondary: "ui-button-secondary",
  danger: "ui-button-danger",
  ghost: "ui-button-ghost",
};

const sizeClassMap = {
  sm: "ui-button-sm",
  md: "ui-button-md",
  lg: "ui-button-lg",
};

function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  leadingIcon = null,
  trailingIcon = null,
  type = "button",
  ...props
}) {
  const classes = [
    "ui-button",
    variantClassMap[variant] || variantClassMap.primary,
    sizeClassMap[size] || sizeClassMap.md,
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...props}>
      {leadingIcon}
      <span>{children}</span>
      {trailingIcon}
    </button>
  );
}

export default Button;
