function StatusPill({ active }) {
  return (
    <span className={active ? "status-pill active" : "status-pill inactive"}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default StatusPill;
