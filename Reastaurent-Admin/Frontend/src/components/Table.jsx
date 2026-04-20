import { useEffect, useMemo, useState } from "react";
import SearchBar from "./SearchBar";
import { Button, Card } from "./ui";

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
  toolbarContent = null,
  compactToolbar = false,
  className = "",
  scrollAreaClassName = "",
  rowActions = [],
  searchPlaceholder = "Search...",
  totalRowsLabel = "Total Rows",
  loading = false,
  currentPage = 1,
  totalItems = 0,
  onPageChange,
  pageSize: propPageSize,
  getRowClassName,
  getRowCellClassName,
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
    <Card
      className={[
        "flex h-[calc(100vh-180px)] min-h-[430px] flex-col overflow-hidden p-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="shrink-0 pb-2">
        <div className="flex flex-wrap items-start gap-3 xl:flex-nowrap">
          <div
            className={`w-full xl:shrink-0 ${
              compactToolbar
                ? "min-[480px]:w-[150px] xl:w-[160px]"
                : "min-[480px]:w-[230px] xl:w-[240px]"
            }`}
          >
            <SearchBar
              placeholder={searchPlaceholder}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              compact={compactToolbar}
            />
          </div>
          {toolbarContent ? (
            <div className="min-w-0 flex-1 overflow-hidden pb-1">
              <div className="flex min-w-max items-center gap-2">
                {toolbarContent}
              </div>
            </div>
          ) : null}
          {filterOptions.map((filter) => (
            <div key={filter.key} className="flex items-center gap-2 font-semibold text-text-base">
              <span>{filter.label}:</span>
              <select
                value={activeFilters[filter.key]}
                onChange={(event) => handleFilterChange(filter.key, event.target.value)}
                className="ui-input-base h-10 min-w-[140px] rounded-xl px-3 py-2"
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

      <div
        className={[
          "min-h-0 flex-1 max-w-full overflow-auto rounded-2xl border border-border-subtle bg-surface-elevated",
          scrollAreaClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {loading ? (
          <div className="grid min-h-[180px] place-items-center gap-[10px] text-[1.05rem] text-text-muted">Loading...</div>
        ) : filteredData.length === 0 ? (
          <div className="grid min-h-[180px] place-items-center gap-[10px] text-[1.05rem] text-text-muted">
            <span className="text-[2rem] text-accent-500">!</span>
            <span>No data</span>
          </div>
        ) : (
          <table className="min-w-max w-full border-collapse table-auto">
            <thead>
              <tr>
                {regularColumns.map((header) => (
                  <th
                    key={header.key}
                    onClick={() => handleSort(header.key)}
                    className="sticky top-0 z-[20] border-b border-border-strong bg-surface-elevated px-4 py-3 text-center text-[0.7rem] font-bold uppercase tracking-[0.1em] text-text-muted"
                    style={header.width ? { minWidth: header.width } : undefined}
                  >
                    <div className="inline-flex items-center gap-1">{header.label}</div>
                  </th>
                ))}
                {stickyColumns.map((header, idx) => (
                  <th
                    key={header.key}
                    onClick={() => handleSort(header.key)}
                    className="sticky top-0 z-[30] border-b border-border-strong bg-surface-elevated px-4 py-3 text-center text-[0.7rem] font-bold uppercase tracking-[0.1em] text-text-muted"
                    style={{ right: `${stickyRightOffsets[idx]}px`, minWidth: header.width || undefined }}
                  >
                    <div className="inline-flex items-center gap-1">{header.label}</div>
                  </th>
                ))}
                {rowActions.length > 0 ? (
                  <th className="sticky top-0 right-0 z-[30] border-b border-border-strong bg-surface-elevated px-4 py-3 text-center text-[0.7rem] font-bold uppercase tracking-[0.1em] text-text-muted">
                    ACTIONS
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {pagedData.map((item) => {
                const rowClassName = getRowClassName?.(item) || "";
                const rowCellClassName = getRowCellClassName?.(item) || "";

                return (
                <tr key={item.id} className={rowClassName}>
                  {regularColumns.map((header) => (
                    <td
                      key={header.key}
                      className={`border-b border-border-subtle bg-surface-elevated px-4 py-3.5 text-center whitespace-nowrap text-[0.92rem] text-text-base transition-colors duration-200 ${rowCellClassName}`}
                      style={header.width ? { minWidth: header.width } : undefined}
                    >
                      {header.content
                        ? header.content(item)
                        : header.key.includes("date") || header.key.endsWith("_at")
                        ? formatDateTime(item[header.key])
                        : item[header.key] ?? "-"}
                    </td>
                  ))}
                  {stickyColumns.map((header, idx) => (
                    <td
                      key={header.key}
                      className={`sticky z-[2] border-b border-border-subtle bg-surface-elevated px-4 py-3.5 text-center whitespace-nowrap text-[0.92rem] text-text-base transition-colors duration-200 ${rowCellClassName}`}
                      style={{ right: `${stickyRightOffsets[idx]}px`, minWidth: header.width || undefined }}
                    >
                      {header.content
                        ? header.content(item)
                        : header.key.includes("date") || header.key.endsWith("_at")
                        ? formatDateTime(item[header.key])
                        : item[header.key] ?? "-"}
                    </td>
                  ))}
                  {rowActions.length > 0 ? (
                    <td
                      className={`sticky right-0 z-[2] border-b border-border-subtle bg-surface-elevated px-4 py-3.5 text-center whitespace-nowrap text-[0.92rem] text-text-base transition-colors duration-200 ${rowCellClassName}`}
                    >
                      <div className="flex flex-wrap items-center justify-center gap-2.5">
                        {rowActions.map((action) => (
                          <Button
                            key={action.label}
                            onClick={() => action.handler(item)}
                            variant="ghost"
                            size="sm"
                            className="min-h-0 px-0 py-0 font-bold text-brand-600 hover:text-brand-700"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </td>
                  ) : null}
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-1 flex shrink-0 flex-wrap items-center justify-between gap-2 px-1 py-1">
        <span className="text-[0.85rem] font-bold text-text-muted">
          {totalRowsLabel}: {totalItems}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              className="h-8 min-w-[58px] rounded-lg px-3 text-[0.85rem] disabled:opacity-50"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1, rowsPerPage)}
            >
              Prev
            </Button>
            <span className="grid h-[32px] min-w-[32px] place-items-center rounded-lg bg-brand-50 text-[0.85rem] font-extrabold text-brand-700">
              {currentPage}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 min-w-[58px] rounded-lg px-3 text-[0.85rem] disabled:opacity-50"
              disabled={currentPage * rowsPerPage >= totalItems}
              onClick={() => handlePageChange(currentPage + 1, rowsPerPage)}
            >
              Next
            </Button>
          </div>
          <select
            value={rowsPerPage}
            onChange={(event) => handlePageChange(1, Number(event.target.value))}
            className="ui-input-base h-8 w-fit rounded-lg px-2 py-0 text-[0.85rem] shadow-none"
          >
            <option value={10}>10 / p</option>
            <option value={20}>20 / p</option>
            <option value={50}>50 / p</option>
            <option value={100}>100 / p</option>
          </select>
        </div>
      </div>
    </Card>
  );
}

export default Table;
