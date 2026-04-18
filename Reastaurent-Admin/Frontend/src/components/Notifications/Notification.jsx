import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  NOTIFICATION_LIST,
  NOTIFICATION_MARK_ALL_READ,
} from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import StatusPill from "../common/StatusPill";
import Table from "../Table";
import ActionPopover from "../ActionPopover";
import {
  setNotificationData,
  setNotificationSelectedItem,
} from "../../Redux/CardSlice";

function Notification() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const fetchData = async (page = 1, limit = 10) => {
    setLoading(true);

    try {
      const response = await fetchWithRefreshToken(NOTIFICATION_LIST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page, limit }),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to fetch notifications");
      }

      setData(responseData.data || []);
      setTotalCount(responseData.pagination?.totalRecords || 0);
      dispatch(setNotificationData(responseData.data || []));
    } catch (error) {
      toast.error(error.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handleRowAction = (rowData, target) => {
    dispatch(setNotificationSelectedItem(rowData));
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

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true);

    try {
      const response = await fetchWithRefreshToken(NOTIFICATION_MARK_ALL_READ, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to mark notifications as read");
      }

      toast.success("All notifications marked as read");
      fetchData(currentPage, pageSize);
    } catch (error) {
      toast.error(error.message || "Failed to mark notifications as read");
    } finally {
      setMarkingAllRead(false);
    }
  };

  const headers = [
    { key: "id", label: "Id", width: "45px" },
    { key: "notification_type", label: "Type", width: "120px" },
    { key: "entity", label: "Entity", width: "90px" },
    { key: "action", label: "Action", width: "90px" },
    { key: "title", label: "Title", width: "220px" },
    { key: "message", label: "Message", width: "280px" },
    {
      key: "is_read",
      label: "Read Status",
      width: "95px",
      content: (item) => (
        <StatusPill
          active={Number(item.is_read) === 1}
          label={Number(item.is_read) === 1 ? "read" : "unread"}
        />
      ),
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
            className="min-w-[150px] rounded-[8px] border-0 bg-[#57b98f] px-4 py-[11px] font-semibold text-white disabled:opacity-70"
            disabled={markingAllRead}
            onClick={handleMarkAllRead}
          >
            {markingAllRead ? "Marking..." : "Mark All Read"}
          </button>
          <div className="flex items-center gap-[10px] font-semibold text-slate-500">
            <span>Home</span>
            <span>/</span>
            <strong className="text-[#3f9773]">Notifications</strong>
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
        hideEdit
        onView={() =>
          handleRowAction(selectedRow, (value) => `/viewnotification/${value}`)
        }
        onDelete={() =>
          handleRowAction(selectedRow, (value) => `/deletenotification/${value}`)
        }
      />
    </div>
  );
}

export default Notification;
