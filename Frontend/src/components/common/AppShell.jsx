import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import { ADMIN_LOGOUT, APP_TITLE } from "../../Utils/Constant";
import { clearAuthSession, getStoredAdminProfile } from "../../Utils/authStorage";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";

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

function AppShell() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 960);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 960);
  const [adminProfile, setAdminProfile] = useState(() => getStoredAdminProfile());

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

  const avatarLabel = adminProfile?.name?.trim?.()?.charAt(0)?.toUpperCase() || "B";

  return (
    <div
      className={`app-shell${isSidebarOpen ? " sidebar-open" : " sidebar-collapsed"}${
        isMobile ? " sidebar-mobile" : ""
      }`}
    >
      {isMobile && isSidebarOpen ? (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <aside className="sidebar-shell">
        <Sidebar
          collapsed={!isSidebarOpen && !isMobile}
          onNavigate={isMobile ? () => setIsSidebarOpen(false) : undefined}
        />
      </aside>
      <main className="main-content admin-main">
        <header className="topbar">
          <div className="topbar-title">
            <button
              type="button"
              className="sidebar-toggle-btn"
              aria-label="Toggle sidebar"
              aria-expanded={isSidebarOpen}
              onClick={handleToggleSidebar}
            >
              <MenuIcon className="sidebar-toggle-icon" />
            </button>
            <strong>{APP_TITLE}</strong>
          </div>
          <div className="topbar-actions">
            <div className="topbar-profile">
              <div className="topbar-profile-copy">
                <strong>{adminProfile?.name || "Cafe Admin"}</strong>
                <span>{adminProfile?.email || "admin@bagelmastercafe.com"}</span>
              </div>
              <div className="topbar-avatar">{avatarLabel}</div>
            </div>
            <button type="button" className="ghost-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
        <section className="outlet-host">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default AppShell;
