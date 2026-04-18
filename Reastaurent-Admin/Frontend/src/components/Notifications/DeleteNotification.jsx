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
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="m-0 text-[0.78rem] font-bold uppercase tracking-normal text-red-500">
            Notifications
          </p>
          <h2 className="mt-2 mb-0 text-[clamp(1.7rem,2vw,2.4rem)] leading-[1.1]">
            Delete Notification
          </h2>
        </div>
        <button
          className="self-start rounded-[8px] border-0 bg-slate-200 px-4 py-[11px] font-semibold text-slate-900 transition hover:-translate-y-px"
          onClick={() => navigate("/notifications")}
        >
          Back
        </button>
      </div>

      <div className="rounded-[8px] border border-[rgba(248,113,113,0.25)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">
        <div className="grid gap-4">
          <h3 className="m-0 text-[1.2rem] font-bold text-slate-900">
            Delete this notification?
          </h3>
          <p className="m-0 text-slate-600">
            {notification?.title || "Selected notification"} will be removed from
            the notifications list.
          </p>
          <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div>
              <strong>Title:</strong> {notification?.title || "-"}
            </div>
            <div className="mt-2">
              <strong>Message:</strong> {notification?.message || "-"}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-[8px] border-0 bg-red-600 px-4 py-[11px] font-semibold text-white disabled:opacity-70"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Delete"}
            </button>
            <button
              type="button"
              className="rounded-[8px] border-0 bg-slate-200 px-4 py-[11px] font-semibold text-slate-900"
              onClick={() => navigate("/notifications")}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteNotification;
