import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BACKEND_BASE_URL, ITEM_LIST } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import StatusPill from "../../components/common/StatusPill";
import Table from "../Table";
import ActionPopover from "../ActionPopover";
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
    { key: "id", label: "Id", width: "45px" },
    { key: "category_name", label: "Category Name", width: "120px" },
    {
      key: "category_image",
      label: "Category Image",
      width: "90px",
      content: (item) => (
        <img
          className="h-11 w-16 rounded-[8px] object-cover"
          src={`${BACKEND_BASE_URL}/images/${item.category_image}`}
          alt={item.category_name}
          onError={(event) => {
            event.currentTarget.src = `https://placehold.co/120x90/e2f6ef/205c49?text=${encodeURIComponent(
              item.category_name || "Category"
            )}`;
          }}
        />
      ),
    },
    { key: "item_name", label: "Item Name", width: "110px" },
    {
      key: "item_image",
      label: "Item Image",
      width: "90px",
      content: (item) => (
        <img
          className="h-11 w-16 rounded-[8px] object-cover"
          src={`${BACKEND_BASE_URL}/images/${item.item_image}`}
          alt={item.item_name}
          onError={(event) => {
            event.currentTarget.src = `https://placehold.co/120x90/e2f6ef/205c49?text=${encodeURIComponent(
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
      label: "Price",
      width: "90px",
      content: (item) => (
        <div className="flex flex-col items-center gap-0.5">
          {item.discount_price != null ? (
            <>
              <span className="line-through text-slate-400 text-xs">£{Number(item.price || 0).toFixed(2)}</span>
              <span className="font-semibold text-red-600">£{Number(item.discount_price).toFixed(2)}</span>
            </>
          ) : (
            <span className="font-semibold text-slate-800">£{Number(item.price || 0).toFixed(2)}</span>
          )}
        </div>
      ),
    },
    {
      key: "preparation_time",
      label: "Prep Time",
      width: "80px",
      content: (item) => (
        <span className="text-slate-700">
          {item.preparation_time != null ? `${item.preparation_time} min` : "-"}
        </span>
      ),
    },
    {
      key: "is_popular",
      label: "Popular",
      width: "75px",
      content: (item) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            Number(item.is_popular) === 1
              ? "bg-amber-100 text-amber-800"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {Number(item.is_popular) === 1 ? "Popular" : "No"}
        </span>
      ),
    },
    {
      key: "is_new",
      label: "New",
      width: "65px",
      content: (item) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            Number(item.is_new) === 1
              ? "bg-blue-100 text-blue-800"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {Number(item.is_new) === 1 ? "NEW" : "No"}
        </span>
      ),
    },
    {
      key: "is_veg",
      label: "Veg",
      width: "65px",
      content: (item) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            Number(item.is_veg) === 1
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {Number(item.is_veg) === 1 ? "🟢 Veg" : "🔴 Non"}
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
          className="h-9 w-9 rounded-[8px] border-0 bg-transparent text-[1.3rem] font-extrabold text-blue-600"
          onClick={(event) => handleOpenActions(event, rowData)}
        >
          ...
        </button>
      ),
    },
  ];

  return (
    <div className="grid min-h-0 content-start gap-[18px]">
      <section className="min-h-0 overflow-hidden rounded-[8px] border border-[#d8ece3] bg-[#e7f7f0] p-[10px]">
        <div className="flex min-h-[56px] flex-wrap items-center justify-between gap-3 px-[6px] pb-2 pt-1">
          <button className="min-w-[92px] rounded-[8px] border-0 bg-[#57b98f] px-4 py-[11px] font-semibold text-white" onClick={() => navigate("/additem")}>
            Add
          </button>
          <div className="flex items-center gap-[10px] font-semibold text-slate-500">
            <span>Home</span>
            <span>/</span>
            <strong className="text-[#3f9773]">Items</strong>
          </div>
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
      </section>

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
