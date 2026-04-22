function ActionPopover({
  anchorEl,
  open,
  handleClose,
  selectedRow,
  onEdit,
  onDelete,
  onView,
  onPrint,
  hideEdit = false,
  hideDelete = false,
  hideView = false,
  hidePrint = false,
}) {
  if (!open || !anchorEl) {
    return null;
  }

  const rect = anchorEl.getBoundingClientRect();
  const popoverWidth = 156;
  const popoverHeight = hidePrint ? 180 : 230;
  const left = Math.max(8, Math.min(rect.right - popoverWidth, window.innerWidth - popoverWidth - 8));
  const top = Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - popoverHeight - 8));

  return (
    <div className="fixed inset-0 z-[999]" onClick={handleClose}>
      <div
        className="fixed z-[1000] flex min-w-[156px] flex-col gap-1.5 rounded-2xl border border-border-subtle bg-surface-elevated p-2 shadow-lg backdrop-blur-md"
        style={{ left: `${Math.round(left)}px`, top: `${Math.round(top)}px` }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-surface-muted text-text-muted hover:text-text-strong"
          onClick={handleClose}
          type="button"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-2 pb-1 pt-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-text-muted">
          Actions
        </div>

        {!hideEdit ? (
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl bg-transparent px-3 py-2.5 text-left transition-colors hover:bg-surface-panel"
            onClick={() => {
              onEdit?.(selectedRow);
              handleClose();
            }}
          >
            <span className="h-[10px] w-[10px] rounded-full bg-blue-600" />
            <span>Edit</span>
          </button>
        ) : null}

        {!hideView ? (
          <button
            type="button"
            className="flex items-center gap-[10px] rounded-[8px] bg-transparent px-[10px] py-2 text-left hover:bg-surface-hover"
            onClick={() => {
              onView?.(selectedRow);
              handleClose();
            }}
          >
            <span className="h-[10px] w-[10px] rounded-full bg-slate-500" />
            <span>View</span>
          </button>
        ) : null}

        {!hideDelete ? (
          <button
            type="button"
            className="flex items-center gap-[10px] rounded-[8px] bg-transparent px-[10px] py-2 text-left hover:bg-red-500/10"
            onClick={() => {
              onDelete?.(selectedRow);
              handleClose();
            }}
          >
            <span className="h-[10px] w-[10px] rounded-full bg-red-600" />
            <span>Delete</span>
          </button>
        ) : null}

        {!hidePrint ? (
          <button
            type="button"
            className="flex items-center gap-[10px] rounded-[8px] bg-transparent px-[10px] py-2 text-left hover:bg-emerald-500/10"
            onClick={() => {
              onPrint?.(selectedRow);
              handleClose();
            }}
          >
            <span className="h-[10px] w-[10px] rounded-full bg-emerald-600" />
            <span>Print Invoice</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default ActionPopover;
