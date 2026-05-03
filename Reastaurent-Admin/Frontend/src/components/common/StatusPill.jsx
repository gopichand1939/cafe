const humanizeValue = (value = "") =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const resolveToneClassName = ({ active, label }) => {
  const normalizedLabel = String(label || "").toLowerCase();

  if (["delivered", "paid", "active", "completed", "success"].includes(normalizedLabel)) {
    return "bg-success-bg text-success-text";
  }

  if (["placed", "pending", "preparing", "accepted", "ready"].includes(normalizedLabel)) {
    return "bg-warning-bg text-warning-text";
  }

  if (["cancelled", "canceled", "failed", "inactive", "deleted"].includes(normalizedLabel)) {
    return "bg-error-bg text-error-text";
  }

  return active ? "bg-success-bg text-success-text" : "bg-error-bg text-error-text";
};

function StatusPill({ active = false, label }) {
  const content = label ? humanizeValue(label) : active ? "Active" : "Inactive";

  return (
    <span
      className={`inline-flex min-w-[112px] items-center justify-center rounded-full px-3 py-[7px] text-[0.86rem] font-bold ${resolveToneClassName({
        active,
        label,
      })}`}
    >
      {content}
    </span>
  );
}

export default StatusPill;
