function PageSection({
  title,
  subtitle,
  eyebrow = "Admin Panel",
  actions = null,
  className = "",
}) {
  return (
    <div
      className={[
        "flex flex-col justify-between gap-4 sm:flex-row sm:items-start",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div>
        <p className="ui-eyebrow">{eyebrow}</p>
        <h2 className="ui-heading">{title}</h2>
        {subtitle ? <p className="ui-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2.5">{actions}</div> : null}
    </div>
  );
}

export default PageSection;
