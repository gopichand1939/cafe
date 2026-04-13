function useSortIcon(sortColumn, sortOrder, column) {
  if (sortColumn !== column) {
    return () => <span className="sort-icon">+</span>;
  }

  return sortOrder === "asc"
    ? () => <span className="sort-icon">^</span>
    : () => <span className="sort-icon">v</span>;
}

export default useSortIcon;
