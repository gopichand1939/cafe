function EmptyState({ title, message, action }) {
  return (
    <div className="grid min-h-[220px] place-items-center rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-7 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">
      <div>
        <h3 className="m-0">{title}</h3>
        <p className="mt-2.5 max-w-[46ch] text-slate-600">{message}</p>
      </div>
      {action}
    </div>
  );
}

export default EmptyState;
