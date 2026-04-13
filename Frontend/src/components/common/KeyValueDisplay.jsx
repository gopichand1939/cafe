function KeyValueDisplay({ data, fields = [] }) {
  const resolvedFields =
    Array.isArray(fields) && fields.length > 0
      ? fields
      : Object.keys(data || {}).map((key) => ({
          key,
          label: key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase()),
        }));

  return (
    <div className="key-value-grid">
      {resolvedFields.map((field) => {
        const content =
          typeof field.render === "function"
            ? field.render(data)
            : (data?.[field.key] ?? "-");

        return (
          <div
            key={field.key}
            className={field.fullWidth ? "key-value-card key-value-card-full" : "key-value-card"}
          >
            <span className="key-value-label">{field.label}</span>
            <div className="key-value-value">{content}</div>
          </div>
        );
      })}
    </div>
  );
}

export default KeyValueDisplay;
