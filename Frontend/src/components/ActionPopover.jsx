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
    <div className="action-popover-overlay" onClick={handleClose}>
      <div
        className="action-popover"
        style={{
          position: "fixed",
          top: rect.bottom + 6,
          left: rect.left - 120,
          zIndex: 1000,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="action-popover-close" onClick={handleClose} type="button">
          x
        </button>

        {!hideEdit ? (
          <button
            type="button"
            className="action-popover-item"
            onClick={() => {
              onEdit?.(selectedRow);
              handleClose();
            }}
          >
            <span className="action-icon edit" />
            <span>Edit</span>
          </button>
        ) : null}

        {!hideView ? (
          <button
            type="button"
            className="action-popover-item"
            onClick={() => {
              onView?.(selectedRow);
              handleClose();
            }}
          >
            <span className="action-icon view" />
            <span>View</span>
          </button>
        ) : null}

        {!hideDelete ? (
          <button
            type="button"
            className="action-popover-item"
            onClick={() => {
              onDelete?.(selectedRow);
              handleClose();
            }}
          >
            <span className="action-icon delete" />
            <span>Delete</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default ActionPopover;
