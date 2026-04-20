import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ITEM_LIST } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import { getImageUrl } from "../../Utils/imageUrl";
import StatusPill from "../../components/common/StatusPill";
import Table from "../Table";
import ActionPopover from "../ActionPopover";
import { Button, Card, PageSection } from "../ui";
import { setItemData, setItemSelectedItem } from "../../Redux/CardSlice";

function Item() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const fetchData = async (page = 1, limit = 10) => {
    setLoading(true);

    try {
      const response = await fetchWithRefreshToken(ITEM_LIST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page, limit }),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to fetch items");
      }

      setData(responseData.data || []);
      setTotalCount(responseData.pagination?.totalRecords || 0);
      dispatch(setItemData(responseData.data || []));
    } catch (error) {
      toast.error(error.message || "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handleRowAction = (rowData, target) => {
    dispatch(setItemSelectedItem(rowData));
    navigate(target(rowData.id));
  };

  const handlePageChange = (page, nextPageSize) => {
    setCurrentPage(page);
    setPageSize(nextPageSize);
  };

  const handleOpenActions = (event, rowData) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(rowData);
  };

  const handleCloseActions = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const headers = [
    { key: "id", label: "ID", width: "60px" },
    { key: "category_name", label: "CATEGORY", width: "140px" },
    {
      key: "category_image",
      label: "CAT IMAGE",
      width: "110px",
      content: (item) => (
        <img
          className="h-11 w-16 rounded-[8px] object-cover"
          src={getImageUrl(item, "category_image")}
          alt={item.category_name}
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.src = `https://placehold.co/120x90/1a2333/cbd5e1?text=${encodeURIComponent(
              item.category_name || "Category"
            )}`;
          }}
        />
      ),
    },
    { key: "item_name", label: "ITEM NAME", width: "150px" },
    {
      key: "item_image",
      label: "ITEM IMAGE",
      width: "110px",
      content: (item) => (
        <img
          className="h-11 w-16 rounded-[8px] object-cover"
          src={getImageUrl(item, "item_image")}
          alt={item.item_name}
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.src = `https://placehold.co/120x90/1a2333/cbd5e1?text=${encodeURIComponent(
              item.item_name
            )}`;
          }}
        />
      ),
    },
    {
      key: "item_description",
      label: "Description",
      content: (item) => (
        <span className="inline-block max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap align-middle" title={item.item_description || "-"}>
          {item.item_description || "-"}
        </span>
      ),
    },
    {
      key: "price",
      label: "PRICE",
      width: "100px",
      content: (item) => (
        <div className="flex flex-col items-center gap-0.5">
          {item.discount_price != null ? (
            <>
              <span className="line-through text-text-muted text-xs">£{Number(item.price || 0).toFixed(2)}</span>
              <span className="font-semibold text-red-400">£{Number(item.discount_price).toFixed(2)}</span>
            </>
          ) : (
            <span className="font-semibold text-text-strong">£{Number(item.price || 0).toFixed(2)}</span>
          )}
        </div>
      ),
    },
    {
      key: "preparation_time",
      label: "PREP TIME",
      width: "100px",
      content: (item) => (
        <span className="text-text-base">
          {item.preparation_time != null ? `${item.preparation_time} min` : "-"}
        </span>
      ),
    },
    {
      key: "is_popular",
      label: "POPULAR",
      width: "95px",
      content: (item) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wider ${
            Number(item.is_popular) === 1
              ? "bg-amber-500/10 text-amber-500"
              : "bg-surface-panel text-text-muted"
          }`}
        >
          {Number(item.is_popular) === 1 ? "Popular" : "Regular"}
        </span>
      ),
    },
    {
      key: "is_new",
      label: "NEW",
      width: "85px",
      content: (item) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wider ${
            Number(item.is_new) === 1
              ? "bg-blue-500/20 text-blue-400"
              : "bg-surface-panel text-text-muted"
          }`}
        >
          {Number(item.is_new) === 1 ? "NEW" : "Old"}
        </span>
      ),
    },
    {
      key: "is_veg",
      label: "VEG",
      width: "90px",
      content: (item) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wider ${
            Number(item.is_veg) === 1
              ? "bg-success-bg text-success-text"
              : "bg-error-bg text-error-text"
          }`}
        >
          {Number(item.is_veg) === 1 ? "VEG 🟢" : "NON 🔴"}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      width: "80px",
      sticky: true,
      content: (item) => <StatusPill active={Number(item.is_active) === 1} />,
    },
    {
      key: "actions",
      label: "Actions",
      width: "70px",
      sticky: true,
      content: (rowData) => (
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-lg border-0 bg-transparent text-[1.4rem] font-black text-brand-500 hover:bg-surface-panel transition-colors"
          onClick={(event) => handleOpenActions(event, rowData)}
        >
          ...
        </button>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="px-6 pt-3 pb-1">
        <PageSection
          eyebrow="Management"
          title="Items"
          actions={
            <Button onClick={() => navigate("/additem")}>
              Add
            </Button>
          }
        />
      </div>

      <Table
        data={data}
        headers={headers}
        loading={loading}
        searchPlaceholder="Search..."
        totalRowsLabel="Total Rows"
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        totalItems={totalCount}
      />

      <ActionPopover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        handleClose={handleCloseActions}
        selectedRow={selectedRow}
        onEdit={() => handleRowAction(selectedRow, (value) => `/edititem/${value}`)}
        onView={() => handleRowAction(selectedRow, (value) => `/viewitem/${value}`)}
        onDelete={() => handleRowAction(selectedRow, (value) => `/deleteitem/${value}`)}
      />
    </div>
  );
}

export default Item;
