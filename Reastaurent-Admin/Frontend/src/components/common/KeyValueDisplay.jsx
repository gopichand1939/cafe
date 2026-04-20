import { Card } from "../ui";

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
          <Card
            key={field.key}
            tone="subtle"
            padding="sm"
            className={`${
              field.fullWidth ? "md:col-span-2" : ""
            } grid gap-1`}
          >
            <span className="text-[0.74rem] font-extrabold uppercase tracking-wider text-text-muted">{field.label}</span>
            <div className="break-words text-[1.05rem] font-bold text-text-strong">{content}</div>
          </Card>
        );
      })}
    </div>
  );
}

export default KeyValueDisplay;
