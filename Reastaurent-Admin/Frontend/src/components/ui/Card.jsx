const toneClassMap = {
  default: "ui-panel",
  subtle: "ui-panel-muted",
  danger: "ui-panel-danger",
};

const paddingClassMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-7",
};

function Card({
  children,
  className = "",
  tone = "default",
  padding = "md",
  as: Component = "div",
  ...props
}) {
  const classes = [
    toneClassMap[tone] || toneClassMap.default,
    paddingClassMap[padding] ?? paddingClassMap.md,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}

export default Card;
