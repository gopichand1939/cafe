import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import {
  ADMIN_LOGOUT,
  APP_TITLE,
  NOTIFICATION_MARK_READ,
  NOTIFICATION_UNREAD_SUMMARY,
} from "../../Utils/Constant";
import { clearAuthSession, getStoredAdminProfile } from "../../Utils/authStorage";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import {
  startAdminNotificationAlert,
  stopAdminNotificationAlert,
} from "../../Utils/notificationSound";
import {
  requestBrowserNotificationPermission,
  showBrowserNotification,
} from "../../Utils/browserNotification";
import { useAdminRealtimeUpdates } from "../../realtime/useAdminRealtimeUpdates";

function MenuIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NotificationBellIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 4.5a4 4 0 0 1 4 4v2.1c0 .8.22 1.58.64 2.25L18 15v1.5H6V15l1.36-2.15c.42-.67.64-1.45.64-2.25V8.5a4 4 0 0 1 4-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 18.5a2.2 2.2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AppShell() {
  const NEW_NOTIFICATION_HIGHLIGHT_MS = 30000;
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 960);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 960);
  const [adminProfile, setAdminProfile] = useState(() => getStoredAdminProfile());
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [highlightedNotificationIds, setHighlightedNotificationIds] = useState([]);
  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);
  const previousUnreadCountRef = useRef(0);
  const hasLoadedNotificationsRef = useRef(false);

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

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 960;
      setIsMobile(mobile);
      setIsSidebarOpen((prev) => {
        if (mobile) {
          return false;
        }

        return prev || window.innerWidth > 960;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setAdminProfile(getStoredAdminProfile());
  }, []);

  useEffect(() => {
    const requestPermission = async () => {
      await requestBrowserNotificationPermission();
    };

    window.addEventListener("click", requestPermission, { once: true });

    return () => {
      window.removeEventListener("click", requestPermission);
    };
  }, []);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }

      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target)
      ) {
        setIsNotificationMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadUnreadSummary = async () => {
      try {
        const response = await fetchWithRefreshToken(NOTIFICATION_UNREAD_SUMMARY, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            limit: 6,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(data.message || "Failed to fetch notifications");
        }

        if (!isCancelled) {
          const nextUnreadCount = Number(data.data?.unreadCount || 0);
          const previousUnreadCount = previousUnreadCountRef.current;

          if (
            hasLoadedNotificationsRef.current &&
            nextUnreadCount > previousUnreadCount
          ) {
            startAdminNotificationAlert();
          }

          previousUnreadCountRef.current = nextUnreadCount;
          hasLoadedNotificationsRef.current = true;
          setUnreadCount(nextUnreadCount);
          setRecentNotifications(data.data?.notifications || []);
        }
      } catch (_error) {
      }
    };

    loadUnreadSummary();

    return () => {
      isCancelled = true;
      stopAdminNotificationAlert();
    };
  }, []);

  useAdminRealtimeUpdates({
    onNotificationUpdate: async (change) => {
      try {
        const response = await fetchWithRefreshToken(NOTIFICATION_UNREAD_SUMMARY, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            limit: 6,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success === false) {
          return;
        }

        const nextUnreadCount = Number(data.data?.unreadCount || 0);
        const previousUnreadCount = previousUnreadCountRef.current;

        if (
          hasLoadedNotificationsRef.current &&
          nextUnreadCount > previousUnreadCount
        ) {
          startAdminNotificationAlert();
        }

        previousUnreadCountRef.current = nextUnreadCount;
        hasLoadedNotificationsRef.current = true;
        setUnreadCount(nextUnreadCount);
        setRecentNotifications(data.data?.notifications || []);

        if (change?.notificationId || change?.entityId) {
          highlightNotification(change.notificationId || change.entityId);
        }

        if (change?.action === "created") {
          const createdNotification = (data.data?.notifications || []).find(
            (item) =>
              Number(item.id) ===
              Number(change?.notificationId || change?.entityId || 0)
          );

          if (createdNotification) {
            showBrowserNotification({
              title: createdNotification.title || "New notification",
              body: createdNotification.message || "",
              tag: `admin-notification-${createdNotification.id}`,
              requireInteraction: true,
              onClick: () => {
                window.focus();
                setIsNotificationMenuOpen(true);
                navigate(createdNotification.redirect_path || "/notifications");
              },
            });
          }
        }
      } catch (_error) {
      }
    },
  });

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await fetchWithRefreshToken(ADMIN_LOGOUT, {
        method: "POST",
      });
    } catch (_error) {
    } finally {
      clearAuthSession();
      navigate("/login", { replace: true });
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (Number(notification?.is_read) !== 1) {
        const response = await fetchWithRefreshToken(NOTIFICATION_MARK_READ, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: notification.id }),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.success !== false) {
          setUnreadCount((prev) => Math.max(prev - 1, 0));
          setRecentNotifications((prev) =>
            prev.map((item) =>
              item.id === notification.id
                ? { ...item, is_read: 1, read_at: data?.data?.read_at || item.read_at }
                : item
            )
          );
          setHighlightedNotificationIds((prev) =>
            prev.filter((value) => value !== Number(notification.id))
          );
        }
      }
    } catch (_error) {
    } finally {
      setIsNotificationMenuOpen(false);
      stopAdminNotificationAlert();
      navigate(notification?.redirect_path || "/notifications");
    }
  };

  const avatarLabel = adminProfile?.name?.trim?.()?.charAt(0)?.toUpperCase() || "B";

  return (
    <div
      className={`relative grid overflow-hidden ${isMobile ? "grid-cols-1" : isSidebarOpen ? "grid-cols-[295px_minmax(0,1fr)]" : "grid-cols-[92px_minmax(0,1fr)]"} ${
        isMobile ? "min-h-screen" : "h-screen"
      }`}
    >
      {isMobile && isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[19] border-0 bg-[rgba(15,23,42,0.25)]"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`overflow-hidden border-r border-[#d8ece3] bg-white transition-all duration-200 ${
          isMobile
            ? `fixed inset-y-0 left-0 z-20 w-[min(295px,82vw)] shadow-[0_18px_32px_rgba(15,23,42,0.18)] ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`
            : isSidebarOpen
              ? "h-screen w-[295px]"
              : "h-screen w-[92px]"
        }`}
      >
        <Sidebar
          collapsed={!isSidebarOpen && !isMobile}
          onNavigate={isMobile ? () => setIsSidebarOpen(false) : undefined}
          onLogout={handleLogout}
        />
      </aside>
      <main className={`grid gap-[18px] overflow-hidden overflow-x-hidden px-[18px] pb-[18px] pt-[14px] ${isMobile ? "min-h-screen overflow-auto" : "h-screen grid-rows-[auto_minmax(0,1fr)]"}`}>
        <header className="flex min-h-[84px] items-center justify-between rounded-[8px] border border-[#d8ece3] bg-white px-[18px] shadow-[0_8px_24px_rgba(25,60,48,0.08)] max-sm:min-h-[76px] max-sm:px-[14px]">
          <div className="flex items-center gap-[14px]">
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-xl border-0 bg-[linear-gradient(135deg,#56ba90_0%,#4aa57f_100%)] text-white shadow-[0_10px_18px_rgba(86,186,144,0.2)]"
              aria-label="Toggle sidebar"
              aria-expanded={isSidebarOpen}
              onClick={handleToggleSidebar}
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <strong className="text-[1.8rem] text-[#1d4f97] max-sm:text-[1.35rem]">{APP_TITLE}</strong>
          </div>
          <div className="flex items-center gap-[14px] max-sm:gap-2.5">
            <div className="relative" ref={notificationMenuRef}>
              <button
                type="button"
                className="relative grid h-11 w-11 place-items-center rounded-xl border border-[#d8ece3] bg-[#f7fbf9] text-[#1d4f97] shadow-[0_8px_18px_rgba(25,60,48,0.06)]"
                onClick={() => {
                  setIsNotificationMenuOpen((prev) => !prev);
                  stopAdminNotificationAlert();
                }}
              >
                <NotificationBellIcon className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute right-[-6px] top-[-6px] grid min-h-[22px] min-w-[22px] place-items-center rounded-full bg-red-500 px-1 text-[0.72rem] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </button>

              {isNotificationMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-[min(360px,86vw)] rounded-[8px] border border-[#d8ece3] bg-white p-2 shadow-[0_16px_30px_rgba(15,23,42,0.14)]">
                  <div className="flex items-center justify-between border-b border-[#eef2f7] px-2 py-2">
                    <strong className="text-[#1f2937]">Notifications</strong>
                    <span className="text-[0.82rem] font-semibold text-slate-500">
                      {unreadCount} unread
                    </span>
                  </div>

                  <div className="grid max-h-[360px] overflow-y-auto py-2">
                    {recentNotifications.length === 0 ? (
                      <div className="px-2 py-4 text-sm text-slate-500">
                        No unread notifications
                      </div>
                    ) : (
                      recentNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          className={`grid gap-1 rounded-[8px] px-3 py-3 text-left transition-all duration-300 ${
                            highlightedNotificationIds.includes(Number(notification.id))
                              ? "bg-[linear-gradient(90deg,rgba(255,247,237,0.98)_0%,rgba(255,237,213,0.98)_100%)] shadow-[inset_0_0_0_1px_rgba(249,115,22,0.28)] animate-pulse"
                              : "hover:bg-slate-50"
                          } ${
                            Number(notification.is_read) === 1 ? "opacity-70" : ""
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <strong className="text-sm text-[#1f2937]">
                              {notification.title}
                            </strong>
                            {Number(notification.is_read) !== 1 ? (
                              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#57b98f]" />
                            ) : null}
                          </div>
                          <span className="text-[0.83rem] text-slate-600">
                            {notification.message}
                          </span>
                          <span className="text-[0.74rem] font-semibold text-slate-400">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="border-t border-[#eef2f7] px-2 pt-2">
                    <button
                      type="button"
                      className="w-full rounded-[8px] bg-transparent px-3 py-2.5 text-left font-bold text-[#1f2937] hover:bg-slate-50"
                      onClick={() => {
                        setIsNotificationMenuOpen(false);
                        navigate("/notifications");
                      }}
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                className="border-0 bg-transparent p-0"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              >
                <div className="flex items-center gap-3">
                  <div className="hidden gap-0.5 text-right sm:grid">
                    <strong>{adminProfile?.name || "Cafe Admin"}</strong>
                    <span className="text-[0.82rem] text-slate-500">{adminProfile?.email || "admin@bagelmastercafe.com"}</span>
                  </div>
                  <div className="grid h-[42px] w-[42px] place-items-center rounded-full bg-[#f3d8ca] font-extrabold text-[#7c4a2d] max-sm:h-9 max-sm:w-9">
                    {avatarLabel}
                  </div>
                </div>
              </button>

              {isProfileMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+10px)] z-20 min-w-[180px] rounded-[8px] border border-[#d8ece3] bg-white p-2 shadow-[0_16px_30px_rgba(15,23,42,0.14)]">
                  <button
                    type="button"
                    className="w-full rounded-[8px] bg-transparent px-3 py-2.5 text-left font-bold text-[#1f2937] hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate("/timings");
                    }}
                  >
                    Timings
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-[8px] bg-transparent px-3 py-2.5 text-left font-bold text-red-700 hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <section className={`min-h-0 overflow-x-hidden pr-0.5 ${isMobile ? "overflow-visible" : "overflow-y-auto"}`}>
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default AppShell;
