import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  NOTIFICATION_BY_ID,
  NOTIFICATION_DELETE,
} from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import { setNotificationSelectedItem } from "../../Redux/CardSlice";
import { Button, Card, PageSection } from "../ui";

function DeleteNotification() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedNotification = useSelector(
    (state) => state.card.notificationSelectedItem
  );
  const [notification, setNotification] = useState(selectedNotification);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (Number(selectedNotification?.id) === Number(id)) {
      setNotification(selectedNotification);
      return;
    }

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
  }, [dispatch, id, navigate, selectedNotification]);

  const handleDelete = async () => {
    setSubmitting(true);

    try {
      const response = await fetchWithRefreshToken(NOTIFICATION_DELETE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: Number(id) }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to delete notification");
      }

      toast.success("Notification deleted successfully");
      navigate("/notifications");
    } catch (error) {
      toast.error(error.message || "Failed to delete notification");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ui-page">
      <div className="px-6 pt-3 pb-1">
        <PageSection
          eyebrow="Notifications"
          title="Delete Notification"
          actions={
            <Button variant="secondary" onClick={() => navigate("/notifications")}>
              Back
            </Button>
          }
        />
      </div>

      <Card tone="danger">
        <div className="grid gap-5">
          <div className="grid gap-2">
            <h3 className="m-0 text-[1.2rem] font-bold text-text-strong">
              Delete this notification?
            </h3>
            <p className="m-0 text-text-muted">
              {notification?.title || "Selected notification"} will be permanently removed from the system.
            </p>
          </div>

          <div className="rounded-[12px] border border-border-subtle bg-surface-muted p-5">
            <div className="grid gap-3">
              <div className="grid gap-1">
                <span className="ui-label">Title</span>
                <div className="font-bold text-text-strong">{notification?.title || "-"}</div>
              </div>
              <div className="grid gap-1">
                <span className="ui-label">Message</span>
                <div className="text-text-base">{notification?.message || "-"}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Confirm Delete"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate("/notifications")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default DeleteNotification;
