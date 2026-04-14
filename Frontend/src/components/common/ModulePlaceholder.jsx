function ModulePlaceholder({ title }) {
  return (
    <div className="grid gap-[18px] rounded-[20px] border border-[#d8ece3] bg-white p-7 shadow-[0_10px_30px_rgba(30,76,60,0.08)]">
      <div className="grid gap-2">
        <p className="m-0 text-[0.82rem] font-extrabold uppercase tracking-[0.08em] text-[#57b98f]">
          Module
        </p>
        <h2 className="m-0 text-[2rem] leading-[1.1] text-[#1f2937]">{title}</h2>
        <p className="m-0 max-w-[680px] leading-[1.6] text-slate-500">
          This page is enabled by the menu permissions returned from login. You can now attach
          module-specific API actions like Add, View, Edit, and Delete without hardcoding
          sidebar structure in the frontend.
        </p>
      </div>
    </div>
  );
}

export default ModulePlaceholder;
