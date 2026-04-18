import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ORDER_LIST,
} from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import StatusPill from "../common/StatusPill";
import Table from "../Table";
import ActionPopover from "../ActionPopover";
import {
  setOrderData,
  setOrderSelectedItem,
} from "../../Redux/CardSlice";

function Order() {
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
      const response = await fetchWithRefreshToken(ORDER_LIST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page, limit }),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to fetch orders");
      }

      setData(responseData.data || []);
      setTotalCount(responseData.pagination?.totalRecords || 0);
      dispatch(setOrderData(responseData.data || []));
    } catch (error) {
      toast.error(error.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handleRowAction = (rowData, target) => {
    dispatch(setOrderSelectedItem(rowData));
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
    { key: "order_number", label: "Order Number", width: "140px" },
    { key: "customer_name", label: "Customer Name", width: "140px" },
    { key: "customer_phone", label: "Phone", width: "110px" },
    {
      key: "item_count",
      label: "Items",
      width: "70px",
    },
    {
      key: "total_amount",
      label: "Total",
      width: "90px",
      content: (item) => (
        <span className="font-semibold text-slate-800">
          {Number(item.total_amount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: "order_status",
      label: "Order Status",
      width: "95px",
      content: (item) => <StatusPill active={item.order_status !== "cancelled"} label={item.order_status} />,
    },
    {
      key: "payment_status",
      label: "Payment Status",
      width: "95px",
      content: (item) => <StatusPill active={item.payment_status === "paid"} label={item.payment_status} />,
    },
    {
      key: "created_at",
      label: "Created At",
      width: "150px",
      content: (item) => new Date(item.created_at).toLocaleString(),
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
          <button
            className="min-w-[92px] rounded-[8px] border-0 bg-[#57b98f] px-4 py-[11px] font-semibold text-white"
            onClick={() => navigate("/addorder")}
          >
            Add
          </button>
          <div className="flex items-center gap-[10px] font-semibold text-slate-500">
            <span>Home</span>
            <span>/</span>
            <strong className="text-[#3f9773]">Orders</strong>
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
        onEdit={() => handleRowAction(selectedRow, (value) => `/editorder/${value}`)}
        onView={() => handleRowAction(selectedRow, (value) => `/vieworder/${value}`)}
        onDelete={() => handleRowAction(selectedRow, (value) => `/deleteorder/${value}`)}
      />
    </div>
  );
}

export default Order;
