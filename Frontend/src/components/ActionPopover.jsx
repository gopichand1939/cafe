function ActionPopover({
  anchorEl,
  open,
  handleClose,
  selectedRow,
  onEdit,
  onDelete,
  onView,
  hideEdit = false,
  hideDelete = false,
  hideView = false,
}) {
  if (!open || !anchorEl) {
    return null;
  }

  const rect = anchorEl.getBoundingClientRect();

  return (
    <div className="fixed inset-0 z-[999]" onClick={handleClose}>
      <div
        className="fixed z-[1000] flex min-w-[156px] flex-col gap-[6px] rounded-[8px] border border-[#d8ece3] bg-white p-[14px] shadow-[0_16px_30px_rgba(15,23,42,0.15)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-transparent"
          onClick={handleClose}
          type="button"
        >
          x
        </button>

        {!hideEdit ? (
          <button
            type="button"
            className="flex items-center gap-[10px] rounded-[8px] bg-transparent px-[10px] py-2 text-left hover:bg-slate-50"
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
            className="flex items-center gap-[10px] rounded-[8px] bg-transparent px-[10px] py-2 text-left hover:bg-slate-50"
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
            className="flex items-center gap-[10px] rounded-[8px] bg-transparent px-[10px] py-2 text-left hover:bg-slate-50"
            onClick={() => {
              onDelete?.(selectedRow);
              handleClose();
            }}
          >
            <span className="h-[10px] w-[10px] rounded-full bg-red-600" />
            <span>Delete</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default ActionPopover;
