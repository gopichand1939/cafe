function InputField({
  label,
  error,
  hint,
  as = "input",
  className = "",
  inputClassName = "",
  labelClassName = "",
  children,
  ...props
}) {
  const fieldClassName = [
    "ui-input-base",
    error ? "ui-input-error" : "",
    inputClassName,
  ]
    .filter(Boolean)
    .join(" ");

  let control = null;

  if (as === "textarea") {
    control = <textarea className={fieldClassName} {...props} />;
  } else if (as === "select") {
    control = (
      <select className={fieldClassName} {...props}>
        {children}
      </select>
    );
  } else {
    control = <input className={fieldClassName} {...props} />;
  }

  return (
    <label className={["ui-field-shell", className].filter(Boolean).join(" ")}>
      {label ? (
        <span className={["ui-label", labelClassName].filter(Boolean).join(" ")}>
          {label}
        </span>
      ) : null}
      {control}
      {error ? <small className="ui-error-text">{error}</small> : null}
      {!error && hint ? <small className="ui-help-text">{hint}</small> : null}
    </label>
  );
}

export default InputField;
