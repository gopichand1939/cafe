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
    <div className="common-table-card">
      <div className="common-table-toolbar">
        <div className="common-table-tools">
          <div className="common-table-search-wrap">
            <SearchBar
              placeholder={searchPlaceholder}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
          {filterOptions.map((filter) => (
            <div key={filter.key} className="common-table-filter">
              <span>{filter.label}:</span>
              <select
                value={activeFilters[filter.key]}
                onChange={(event) => handleFilterChange(filter.key, event.target.value)}
                className="table-filter-select"
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

      <div className="common-table-scroll">
        {loading ? (
          <div className="common-table-empty">Loading...</div>
        ) : filteredData.length === 0 ? (
          <div className="common-table-empty">
            <span className="common-table-empty-icon">!</span>
            <span>No data</span>
          </div>
        ) : (
          <table className="common-table">
            <thead>
              <tr>
                {regularColumns.map((header) => (
                  <th key={header.key} onClick={() => handleSort(header.key)}>
                    <div className="common-table-head">{header.label}</div>
                  </th>
                ))}
                {stickyColumns.map((header) => (
                  <th
                    key={header.key}
                    onClick={() => handleSort(header.key)}
                    className="common-table-sticky-head"
                  >
                    <div className="common-table-head">
                      {header.label}
                    </div>
                  </th>
                ))}
                {rowActions.length > 0 ? (
                  <th className="common-table-sticky-head">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {pagedData.map((item) => (
                <tr key={item.id}>
                  {regularColumns.map((header) => (
                    <td key={header.key}>
                      {header.content
                        ? header.content(item)
                        : header.key.includes("date") || header.key.endsWith("_at")
                        ? formatDateTime(item[header.key])
                        : item[header.key] ?? "-"}
                    </td>
                  ))}
                  {stickyColumns.map((header) => (
                    <td key={header.key} className="common-table-sticky-cell">
                      {header.content
                        ? header.content(item)
                        : header.key.includes("date") || header.key.endsWith("_at")
                        ? formatDateTime(item[header.key])
                        : item[header.key] ?? "-"}
                    </td>
                  ))}
                  {rowActions.length > 0 ? (
                    <td className="common-table-sticky-cell">
                      <div className="common-table-actions">
                        {rowActions.map((action) => (
                          <button
                            key={action.label}
                            type="button"
                            onClick={() => action.handler(item)}
                            className="table-action-link"
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

      <div className="common-table-pagination">
        <span className="table-total-text">
          {totalRowsLabel}: {totalItems}
        </span>
        <div className="table-pagination-controls">
          <button
            type="button"
            className="table-page-btn"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1, rowsPerPage)}
          >
            Prev
          </button>
          <span className="table-page-number">{currentPage}</span>
          <button
            type="button"
            className="table-page-btn"
            disabled={currentPage * rowsPerPage >= totalItems}
            onClick={() => handlePageChange(currentPage + 1, rowsPerPage)}
          >
            Next
          </button>
          <select
            value={rowsPerPage}
            onChange={(event) => handlePageChange(1, Number(event.target.value))}
            className="table-page-size"
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
