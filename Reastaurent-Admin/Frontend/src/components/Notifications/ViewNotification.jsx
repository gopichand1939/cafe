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
import { Button, Card, PageSection } from "../ui";

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
      <div className="ui-page">
        <Card className="flex min-h-[200px] items-center justify-center text-text-muted">
          Loading notification...
        </Card>
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
    <div className="ui-page">
      <div className="px-6 pt-3 pb-1">
        <PageSection
          eyebrow="Notifications"
          title="View Notification"
          actions={
            <Button variant="secondary" onClick={() => navigate("/notifications")}>
              Back
            </Button>
          }
        />
      </div>

      <Card>
        <div className="grid min-w-0 max-w-[860px] content-start gap-[18px]">
          <KeyValueDisplay data={displayData} fields={fields} />
        </div>
      </Card>
    </div>
  );
}

export default ViewNotification;
