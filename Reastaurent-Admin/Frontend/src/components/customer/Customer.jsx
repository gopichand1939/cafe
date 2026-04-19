import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CUSTOMER_LIST } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import StatusPill from "../common/StatusPill";
import Table from "../Table";
import ActionPopover from "../ActionPopover";
import {
  setCustomerData,
  setCustomerSelectedItem,
} from "../../Redux/CardSlice";
import { subscribeToAdminRealtimeEvent, ADMIN_REALTIME_EVENT_TYPES } from "../../realtime/adminRealtimeEvents";

function Customer() {
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
      const response = await fetchWithRefreshToken(CUSTOMER_LIST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page,
          limit,
        }),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to fetch customers");
      }

      setData(responseData.data || []);
      setTotalCount(responseData.pagination?.totalRecords || 0);
      dispatch(setCustomerData(responseData.data || []));
    } catch (error) {
      toast.error(error.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize]);

  useEffect(() => {
    return subscribeToAdminRealtimeEvent(
      ADMIN_REALTIME_EVENT_TYPES.CUSTOMER_UPDATED,
      () => {
        fetchData(currentPage, pageSize);
      }
    );
  }, [currentPage, pageSize]);

  const handleRowAction = (rowData, target) => {
    dispatch(setCustomerSelectedItem(rowData));
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
    { key: "id", label: "Id" },
    { key: "name", label: "Customer Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Mobile Number" },
    {
      key: "is_active",
      label: "Status",
      content: (item) => <StatusPill active={Number(item.is_active) === 1} />,
    },
    {
      key: "actions",
      label: "Actions",
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
            onClick={() => navigate("/addcustomer")}
          >
            Add
          </button>
          <div className="flex items-center gap-[10px] font-semibold text-slate-500">
            <span>Home</span>
            <span>/</span>
            <strong className="text-[#3f9773]">Customer</strong>
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
        onEdit={() => handleRowAction(selectedRow, (value) => `/editcustomer/${value}`)}
        onView={() => handleRowAction(selectedRow, (value) => `/viewcustomer/${value}`)}
        onDelete={() => handleRowAction(selectedRow, (value) => `/deletecustomer/${value}`)}
      />
    </div>
  );
}

export default Customer;
