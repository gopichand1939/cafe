import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  NOTIFICATION_BY_ID,
  NOTIFICATION_MARK_READ,
} from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import { setNotificationSelectedItem } from "../../Redux/CardSlice";
import KeyValueDisplay from "../common/KeyValueDisplay";

function ViewNotification() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedNotification = useSelector(
    (state) => state.card.notificationSelectedItem
  );
  const [notification, setNotification] = useState(selectedNotification);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const response = await fetchWithRefreshToken(NOTIFICATION_BY_ID, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: Number(id) }),
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(data.message || "Failed to fetch notification");
        }

        setNotification(data.data);
        dispatch(setNotificationSelectedItem(data.data));
      } catch (error) {
        toast.error(error.message || "Failed to fetch notification");
        navigate("/notifications");
      }
    };

    fetchNotification();
  }, [dispatch, id, navigate]);

  useEffect(() => {
    if (!notification || Number(notification.is_read) === 1) {
      return;
    }

    const markAsRead = async () => {
      try {
        const response = await fetchWithRefreshToken(NOTIFICATION_MARK_READ, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: Number(id) }),
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(data.message || "Failed to mark notification as read");
        }

        setNotification(data.data);
        dispatch(setNotificationSelectedItem(data.data));
      } catch (_error) {
      }
    };

    markAsRead();
  }, [dispatch, id, notification]);

  if (!notification) {
    return (
      <div className="rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">
        Loading notification...
      </div>
    );
  }

  const displayData = {
    id: notification.id,
    notification_type: notification.notification_type || "-",
    entity: notification.entity || "-",
    action: notification.action || "-",
    entity_id: notification.entity_id ?? "-",
    title: notification.title || "-",
    message: notification.message || "-",
    redirect_path: notification.redirect_path || "-",
    source: notification.source || "-",
    is_read: Number(notification.is_read) === 1 ? "Read" : "Unread",
    read_at: notification.read_at
      ? new Date(notification.read_at).toLocaleString()
      : "-",
    created_at: new Date(notification.created_at).toLocaleString(),
    updated_at: new Date(notification.updated_at).toLocaleString(),
    payload: JSON.stringify(notification.payload || {}, null, 2),
  };

  const fields = [
    { key: "id", label: "Id" },
    { key: "notification_type", label: "Notification Type" },
    { key: "entity", label: "Entity" },
    { key: "action", label: "Action" },
    { key: "entity_id", label: "Entity Id" },
    { key: "title", label: "Title", fullWidth: true },
    { key: "message", label: "Message", fullWidth: true },
    { key: "redirect_path", label: "Redirect Path" },
    { key: "source", label: "Source" },
    { key: "is_read", label: "Read Status" },
    { key: "read_at", label: "Read At" },
    { key: "created_at", label: "Created At" },
    { key: "updated_at", label: "Updated At" },
    {
      key: "payload",
      label: "Payload",
      fullWidth: true,
      render: (data) => (
        <pre className="m-0 whitespace-pre-wrap text-sm">{data.payload}</pre>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="m-0 text-[0.78rem] font-bold uppercase tracking-normal text-orange-500">
            Notifications
          </p>
          <h2 className="mt-2 mb-0 text-[clamp(1.7rem,2vw,2.4rem)] leading-[1.1]">
            View Notification
          </h2>
        </div>
        <button
          className="self-start rounded-[8px] border-0 bg-slate-200 px-4 py-[11px] font-semibold text-slate-900 transition hover:-translate-y-px"
          onClick={() => navigate("/notifications")}
        >
          Back
        </button>
      </div>

      <div className="mt-[18px] rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">
        <div className="mt-5 grid items-start gap-[22px]">
          <div className="grid min-w-0 max-w-[860px] content-start gap-[18px]">
            <KeyValueDisplay data={displayData} fields={fields} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewNotification;
