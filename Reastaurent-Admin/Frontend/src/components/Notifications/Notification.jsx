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
import { Button, PageSection } from "../ui";
import {
  setNotificationData,
  setNotificationSelectedItem,
} from "../../Redux/CardSlice";
import { subscribeToAdminRealtimeEvent, ADMIN_REALTIME_EVENT_TYPES } from "../../realtime/adminRealtimeEvents";

function Notification() {
  const NEW_NOTIFICATION_HIGHLIGHT_MS = 30000;
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
  const [highlightedNotificationIds, setHighlightedNotificationIds] = useState([]);

  const highlightNotification = (notificationId) => {
    if (!notificationId) {
      return;
    }

    setHighlightedNotificationIds((prev) => [
      ...new Set([...prev, Number(notificationId)]),
    ]);

    window.setTimeout(() => {
      setHighlightedNotificationIds((prev) =>
        prev.filter((value) => value !== Number(notificationId))
      );
    }, NEW_NOTIFICATION_HIGHLIGHT_MS);
  };

  const applyRealtimeNotificationChange = (change) => {
    const action = String(change?.action || "").toLowerCase();
    const realtimeNotification = change?.entityData || null;
    const targetNotificationId = Number(
      change?.notificationId || change?.entityId || realtimeNotification?.id || 0
    );

    if (!targetNotificationId) {
      return;
    }

    if (action === "created" && realtimeNotification) {
      setTotalCount((prev) => prev + 1);
      setData((prev) => {
        const nextData = [
          realtimeNotification,
          ...prev.filter((item) => Number(item.id) !== targetNotificationId),
        ].slice(0, pageSize);

        dispatch(setNotificationData(nextData));
        return nextData;
      });
      return;
    }

    if (action === "updated" && realtimeNotification) {
      setData((prev) => {
        const nextData = prev.map((item) =>
          Number(item.id) === targetNotificationId
            ? { ...item, ...realtimeNotification }
            : item
        );

        dispatch(setNotificationData(nextData));
        return nextData;
      });
      return;
    }

    if (action === "deleted") {
      setTotalCount((prev) => Math.max(prev - 1, 0));
      setData((prev) => {
        const nextData = prev.filter(
          (item) => Number(item.id) !== targetNotificationId
        );

        dispatch(setNotificationData(nextData));
        return nextData;
      });
    }
  };

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

  useEffect(() => {
    return subscribeToAdminRealtimeEvent(
      ADMIN_REALTIME_EVENT_TYPES.NOTIFICATION_UPDATED,
      (change) => {
        const targetNotificationId = change?.notificationId || change?.entityId || null;

        if (change?.action === "created" && targetNotificationId) {
          highlightNotification(targetNotificationId);
          applyRealtimeNotificationChange(change);
          setCurrentPage(1);
          fetchData(1, pageSize);
          return;
        }

        if (targetNotificationId) {
          highlightNotification(targetNotificationId);
        }

        applyRealtimeNotificationChange(change);
        fetchData(currentPage, pageSize);
      }
    );
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
          title="Notifications"
          actions={
            <Button
              variant="secondary"
              disabled={markingAllRead}
              onClick={handleMarkAllRead}
            >
              {markingAllRead ? "Marking..." : "Mark All Read"}
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
        getRowClassName={(item) =>
          highlightedNotificationIds.includes(Number(item.id))
            ? "shadow-[inset_0_0_0_2px_rgba(249,115,22,0.4)]"
            : ""
        }
        getRowCellClassName={(item) =>
          highlightedNotificationIds.includes(Number(item.id))
            ? "bg-accent-500/10 animate-pulse"
            : ""
        }
      />

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
