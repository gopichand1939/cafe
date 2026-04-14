import { useEffect, useRef, useState } from "react";
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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

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
    const handleDocumentClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
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
