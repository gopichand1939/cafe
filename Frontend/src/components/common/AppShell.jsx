import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import { APP_TITLE } from "../../Utils/Constant";

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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 960);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 960);

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

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

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
            <div className="topbar-dot light" />
            <div className="topbar-dot dark" />
            <div className="topbar-avatar">C</div>
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
