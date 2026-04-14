function Loader({ label = "Loading..." }) {
  return (
    <div className="grid min-h-[220px] place-items-center rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-7 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">
      <div className="grid gap-3 place-items-center">
        <div className="h-[42px] w-[42px] animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
        <p className="m-0">{label}</p>
      </div>
    </div>
  );
}

export default Loader;
