function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">Admin Panel</p>
        <h2>{title}</h2>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}

export default PageHeader;
