function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex min-w-[86px] items-center justify-center rounded-full px-3 py-[7px] text-[0.91rem] font-bold ${
        active ? "bg-success-bg text-success-text" : "bg-error-bg text-error-text"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default StatusPill;
