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
    <div className="grid gap-[18px] md:grid-cols-2">
      {resolvedFields.map((field) => {
        const content =
          typeof field.render === "function"
            ? field.render(data)
            : (data?.[field.key] ?? "-");

        return (
          <div
            key={field.key}
            className={`rounded-[8px] border border-slate-200 bg-white px-[18px] py-4 ${
              field.fullWidth ? "md:col-span-2" : ""
            }`}
          >
            <span className="text-[0.92rem] font-semibold text-slate-600">{field.label}</span>
            <div className="mt-1.5 break-words text-base">{content}</div>
          </div>
        );
      })}
    </div>
  );
}

export default KeyValueDisplay;
