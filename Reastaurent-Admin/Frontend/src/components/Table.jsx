import { useEffect, useMemo, useState } from "react";
import SearchBar from "./SearchBar";

const formatDateTime = (dateString) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } catch (error) {
    return dateString;
  }
};

function Table({
  data = [],
  headers = [],
  filterOptions = [],
  rowActions = [],
  searchPlaceholder = "Search...",
  totalRowsLabel = "Total Rows",
  loading = false,
  currentPage = 1,
  totalItems = 0,
  onPageChange,
  pageSize: propPageSize,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(propPageSize || 10);
  const [sortColumn, setSortColumn] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [activeFilters, setActiveFilters] = useState({});
  const stickyColumns = headers.filter((header) => header?.sticky);
  const regularColumns = headers.filter((header) => !header?.sticky);

  // Calculate cumulative right offsets for sticky columns (rightmost = 0, then accumulate)
  const stickyRightOffsets = [];
  let cumulativeRight = 0;
  for (let i = stickyColumns.length - 1; i >= 0; i--) {
    stickyRightOffsets[i] = cumulativeRight;
    const colWidth = parseInt(stickyColumns[i].width, 10) || 80;
    cumulativeRight += colWidth;
  }

  useEffect(() => {
    if (propPageSize) {
      setRowsPerPage(propPageSize);
    }
  }, [propPageSize]);

  useEffect(() => {
    if (!Array.isArray(filterOptions) || filterOptions.length === 0) {
      if (Object.keys(activeFilters).length !== 0) {
        setActiveFilters({});
      }
      return;
    }

    const initialFilters = {};

    filterOptions.forEach((filter) => {
      initialFilters[filter.key] = "all";
    });

    const hasSameKeys =
      Object.keys(initialFilters).length === Object.keys(activeFilters).length &&
      Object.keys(initialFilters).every(
        (key) => activeFilters[key] !== undefined
      );

    if (!hasSameKeys) {
      setActiveFilters(initialFilters);
    }
  }, [filterOptions]);

  const handleFilterChange = (filterKey, value) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  const handleSort = (column) => {
    if (column === "actions") {
      return;
    }

    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      return;
    }

    setSortColumn(column);
    setSortOrder("asc");
  };

  const filteredData = useMemo(() => {
    let result = Array.isArray(data) ? [...data] : [];

    result = result.filter((item) => {
      const matchesSearch = Object.values(item || {})
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
        if (!value || value === "all") return true;
        return item[key]?.toString() === value?.toString();
      });

      return matchesSearch && matchesFilters;
    });

    if (sortColumn) {
      result.sort((a, b) => {
        const aValue = a?.[sortColumn];
        const bValue = b?.[sortColumn];

        if (sortColumn.includes("date") || sortColumn.endsWith("_at")) {
          const dateA = new Date(aValue).getTime();
          const dateB = new Date(bValue).getTime();
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
        }

        return sortOrder === "asc"
          ? String(aValue ?? "").localeCompare(String(bValue ?? ""))
          : String(bValue ?? "").localeCompare(String(aValue ?? ""));
      });
    }

    return result;
  }, [activeFilters, data, searchQuery, sortColumn, sortOrder]);

  const pagedData = useMemo(() => {
    if (filteredData.length <= rowsPerPage) {
      return filteredData;
    }

    const startIndex = Math.max((currentPage - 1) * rowsPerPage, 0);
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [currentPage, filteredData, rowsPerPage]);

  const handlePageChange = (page, pageSize) => {
    setRowsPerPage(pageSize);
    onPageChange?.(page, pageSize);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[430px] flex-col overflow-hidden rounded-[8px] border border-[#d8ece3] bg-white p-2 shadow-[0_10px_30px_rgba(30,76,60,0.08)]">
      <div className="shrink-0 pb-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full min-[480px]:w-[230px]">
            <SearchBar
              placeholder={searchPlaceholder}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
          {filterOptions.map((filter) => (
            <div key={filter.key} className="flex items-center gap-2 font-semibold text-slate-600">
              <span>{filter.label}:</span>
              <select
                value={activeFilters[filter.key]}
                onChange={(event) => handleFilterChange(filter.key, event.target.value)}
                className="h-10 min-w-[140px] rounded-[8px] border border-slate-300 bg-white px-[10px]"
              >
                <option value="all">All</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 max-w-full overflow-auto rounded-[8px]">
        {loading ? (
          <div className="grid min-h-[180px] place-items-center gap-[10px] text-[1.05rem] text-gray-500">Loading...</div>
        ) : filteredData.length === 0 ? (
          <div className="grid min-h-[180px] place-items-center gap-[10px] text-[1.05rem] text-gray-500">
            <span className="text-[2rem] text-violet-500">!</span>
            <span>No data</span>
          </div>
        ) : (
          <table className="w-full border-collapse" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr>
                {regularColumns.map((header) => (
                  <th
                    key={header.key}
                    onClick={() => handleSort(header.key)}
                    className="sticky top-0 z-[1] border-b border-[#e3edf6] bg-[#d8f2e6] px-3 py-2.5 text-center text-[#43536f]"
                    style={header.width ? { width: header.width } : undefined}
                  >
                    <div className="inline-flex items-center gap-1 font-extrabold">{header.label}</div>
                  </th>
                ))}
                {stickyColumns.map((header, idx) => (
                  <th
                    key={header.key}
                    onClick={() => handleSort(header.key)}
                    className="sticky top-0 z-[3] border-b border-[#e3edf6] bg-[#d8f2e6] px-3 py-2.5 text-center text-[#43536f]"
                    style={{ right: `${stickyRightOffsets[idx]}px`, width: header.width || undefined }}
                  >
                    <div className="inline-flex items-center gap-1 font-extrabold">{header.label}</div>
                  </th>
                ))}
                {rowActions.length > 0 ? (
                  <th className="sticky top-0 right-0 z-[3] border-b border-[#e3edf6] bg-[#d8f2e6] px-3 py-2.5 text-center text-[#43536f]">
                    Actions
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {pagedData.map((item) => (
                <tr key={item.id}>
                  {regularColumns.map((header) => (
                    <td key={header.key} className="border-b border-[#e3edf6] bg-white px-3 py-2 text-center whitespace-nowrap text-[#506079]">
                      {header.content
                        ? header.content(item)
                        : header.key.includes("date") || header.key.endsWith("_at")
                        ? formatDateTime(item[header.key])
                        : item[header.key] ?? "-"}
                    </td>
                  ))}
                  {stickyColumns.map((header, idx) => (
                    <td key={header.key} className="sticky z-[2] border-b border-[#e3edf6] bg-white px-3 py-2 text-center whitespace-nowrap text-[#506079]" style={{ right: `${stickyRightOffsets[idx]}px` }}>
                      {header.content
                        ? header.content(item)
                        : header.key.includes("date") || header.key.endsWith("_at")
                        ? formatDateTime(item[header.key])
                        : item[header.key] ?? "-"}
                    </td>
                  ))}
                  {rowActions.length > 0 ? (
                    <td className="sticky right-0 z-[2] border-b border-[#e3edf6] bg-white px-3 py-2 text-center whitespace-nowrap text-[#506079]">
                      <div className="flex flex-wrap items-center justify-center gap-2.5">
                        {rowActions.map((action) => (
                          <button
                            key={action.label}
                            type="button"
                            onClick={() => action.handler(item)}
                            className="bg-transparent font-bold text-blue-600"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-1 flex shrink-0 flex-wrap items-center justify-between gap-2 px-1 py-1">
        <span className="text-[0.85rem] font-bold text-slate-600">
          {totalRowsLabel}: {totalItems}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className="h-[32px] min-w-[58px] rounded-[6px] border border-slate-300 bg-white text-[0.85rem] font-bold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1, rowsPerPage)}
          >
            Prev
          </button>
          <span className="grid h-[32px] min-w-[32px] place-items-center rounded-[6px] bg-blue-50 text-[0.85rem] font-extrabold text-blue-600">
            {currentPage}
          </span>
          <button
            type="button"
            className="h-[32px] min-w-[58px] rounded-[6px] border border-slate-300 bg-white text-[0.85rem] font-bold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={currentPage * rowsPerPage >= totalItems}
            onClick={() => handlePageChange(currentPage + 1, rowsPerPage)}
          >
            Next
          </button>
          <select
            value={rowsPerPage}
            onChange={(event) => handlePageChange(1, Number(event.target.value))}
            className="h-[32px] rounded-[6px] border border-slate-300 bg-white px-[8px] text-[0.85rem]"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default Table;
