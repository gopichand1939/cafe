function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex min-w-[86px] items-center justify-center rounded-full px-3 py-[7px] text-[0.9rem] font-bold ${
        active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default StatusPill;
