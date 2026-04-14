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
    <div className="overflow-hidden rounded-[8px] border border-[#d8ece3] bg-white p-[10px] shadow-[0_10px_30px_rgba(30,76,60,0.08)]">
      <div className="pb-[10px]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full min-[480px]:w-[250px]">
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

      <div className="max-h-[min(420px,calc(100vh-320px))] min-h-[280px] max-w-full overflow-auto rounded-[8px]">
        {loading ? (
          <div className="grid min-h-[220px] place-items-center gap-[10px] text-[1.05rem] text-gray-500">Loading...</div>
        ) : filteredData.length === 0 ? (
          <div className="grid min-h-[220px] place-items-center gap-[10px] text-[1.05rem] text-gray-500">
            <span className="text-[2rem] text-violet-500">!</span>
            <span>No data</span>
          </div>
        ) : (
          <table className="min-w-[760px] w-full table-fixed border-collapse">
            <thead>
              <tr>
                {regularColumns.map((header) => (
                  <th
                    key={header.key}
                    onClick={() => handleSort(header.key)}
                    className="sticky top-0 z-[1] border-b border-[#e3edf6] bg-[#d8f2e6] px-[18px] py-4 text-center text-[#43536f]"
                  >
                    <div className="inline-flex items-center gap-1 font-extrabold">{header.label}</div>
                  </th>
                ))}
                {stickyColumns.map((header) => (
                  <th
                    key={header.key}
                    onClick={() => handleSort(header.key)}
                    className="sticky top-0 right-0 z-[3] border-b border-[#e3edf6] bg-[#d8f2e6] px-[18px] py-4 text-center text-[#43536f]"
                  >
                    <div className="inline-flex items-center gap-1 font-extrabold">{header.label}</div>
                  </th>
                ))}
                {rowActions.length > 0 ? (
                  <th className="sticky top-0 right-0 z-[3] border-b border-[#e3edf6] bg-[#d8f2e6] px-[18px] py-4 text-center text-[#43536f]">
                    Actions
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {pagedData.map((item) => (
                <tr key={item.id}>
                  {regularColumns.map((header) => (
                    <td key={header.key} className="border-b border-[#e3edf6] bg-white px-[18px] py-4 text-center whitespace-nowrap text-[#506079]">
                      {header.content
                        ? header.content(item)
                        : header.key.includes("date") || header.key.endsWith("_at")
                        ? formatDateTime(item[header.key])
                        : item[header.key] ?? "-"}
                    </td>
                  ))}
                  {stickyColumns.map((header) => (
                    <td key={header.key} className="sticky right-0 z-[2] border-b border-[#e3edf6] bg-white px-[18px] py-4 text-center whitespace-nowrap text-[#506079]">
                      {header.content
                        ? header.content(item)
                        : header.key.includes("date") || header.key.endsWith("_at")
                        ? formatDateTime(item[header.key])
                        : item[header.key] ?? "-"}
                    </td>
                  ))}
                  {rowActions.length > 0 ? (
                    <td className="sticky right-0 z-[2] border-b border-[#e3edf6] bg-white px-[18px] py-4 text-center whitespace-nowrap text-[#506079]">
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

      <div className="mt-[14px] flex flex-wrap items-center justify-between gap-3">
        <span className="font-bold text-slate-600">
          {totalRowsLabel}: {totalItems}
        </span>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            className="h-[38px] min-w-[68px] rounded-[8px] border border-slate-300 bg-white font-bold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1, rowsPerPage)}
          >
            Prev
          </button>
          <span className="grid h-[38px] min-w-[38px] place-items-center rounded-[8px] bg-blue-50 font-extrabold text-blue-600">
            {currentPage}
          </span>
          <button
            type="button"
            className="h-[38px] min-w-[68px] rounded-[8px] border border-slate-300 bg-white font-bold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={currentPage * rowsPerPage >= totalItems}
            onClick={() => handlePageChange(currentPage + 1, rowsPerPage)}
          >
            Next
          </button>
          <select
            value={rowsPerPage}
            onChange={(event) => handlePageChange(1, Number(event.target.value))}
            className="h-[38px] rounded-[8px] border border-slate-300 bg-white px-[10px]"
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
