function useSortIcon(sortColumn, sortOrder, column) {
  if (sortColumn !== column) {
    return () => <span className="inline-grid h-4 w-4 place-items-center text-xs font-bold">+</span>;
  }

  return sortOrder === "asc"
    ? () => <span className="inline-grid h-4 w-4 place-items-center text-xs font-bold">^</span>
    : () => <span className="inline-grid h-4 w-4 place-items-center text-xs font-bold">v</span>;
}

export default useSortIcon;
