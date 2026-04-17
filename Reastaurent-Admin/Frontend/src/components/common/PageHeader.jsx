function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div>
        <p className="m-0 text-[0.78rem] font-bold uppercase tracking-normal text-orange-500">
          Admin Panel
        </p>
        <h2 className="mt-2 mb-0 text-[clamp(1.7rem,2vw,2.4rem)] leading-[1.1]">{title}</h2>
        {subtitle ? <p className="mt-2.5 max-w-[62ch] text-slate-600">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2.5">{actions}</div> : null}
    </div>
  );
}

export default PageHeader;
