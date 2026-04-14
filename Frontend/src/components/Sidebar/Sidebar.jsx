import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

function DashboardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="4" width="7" height="4.5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="11.5" width="7" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="14" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function AuthenticationIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8.5 10.5V8.75a3.5 3.5 0 1 1 7 0v1.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="15.25" r="1.2" fill="currentColor" />
    </svg>
  );
}

function SettingsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 8.25a3.75 3.75 0 1 1 0 7.5a3.75 3.75 0 0 1 0-7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19 12a7.14 7.14 0 0 0-.08-1l2-1.55l-2-3.46l-2.42.73a7.7 7.7 0 0 0-1.72-1L14.5 3h-5l-.28 2.72a7.7 7.7 0 0 0-1.72 1l-2.42-.73l-2 3.46l2 1.55a7.14 7.14 0 0 0 0 2l-2 1.55l2 3.46l2.42-.73a7.7 7.7 0 0 0 1.72 1L9.5 21h5l.28-2.72a7.7 7.7 0 0 0 1.72-1l2.42.73l2-3.46l-2-1.55c.05-.33.08-.66.08-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuManagementIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6 5.5h12M6 10.5h12M6 15.5h7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="17.5" cy="15.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function OrdersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.5 8h7M8.5 12h7M8.5 16h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CustomersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 18a4.5 4.5 0 0 1 9 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M14.5 18a3.5 3.5 0 0 1 5 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReviewsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 4l2.1 4.26L18.8 9l-3.4 3.32l.8 4.68L12 14.9L7.8 17l.8-4.68L5.2 9l4.7-.74L12 4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserManagementIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 18a4.5 4.5 0 0 1 9 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M17 8v6M14 11h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CategoryIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3.5" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3.5" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ItemIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6 4.5v15M10 4.5v6.2c0 1.4-1 2.3-2 2.3s-2-.9-2-2.3V4.5M14 8h4.1a1.9 1.9 0 0 1 1.9 1.9V19.5M14 19.5h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ open, style }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={style}>
      <path
        d={open ? "M7 14l5-5l5 5" : "M7 10l5 5l5-5"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const menuConfig = [
  {
    key: "dashboard",
    label: "Dashboard",
    to: "/dashboard",
    Icon: DashboardIcon,
  },
  {
    key: "authentication",
    label: "Authentication",
    to: "/authentication",
    Icon: AuthenticationIcon,
  },
  {
    key: "settings",
    label: "Settings",
    to: "/settings",
    Icon: SettingsIcon,
  },
  {
    key: "menu-management",
    label: "Menu Management",
    Icon: MenuManagementIcon,
    children: [
      {
        key: "category",
        label: "Category",
        to: "/category",
        Icon: CategoryIcon,
        matchPaths: [
          "/category",
          "/addcategory",
          "/editcategory/",
          "/viewcategory/",
          "/deletecategory/",
        ],
      },
      {
        key: "items",
        label: "Items",
        to: "/items",
        Icon: ItemIcon,
        matchPaths: [
          "/items",
          "/additem",
          "/edititem/",
          "/viewitem/",
          "/deleteitem/",
        ],
      },
    ],
  },
  {
    key: "orders",
    label: "Orders",
    to: "/orders",
    Icon: OrdersIcon,
  },
  {
    key: "customers",
    label: "Customers",
    to: "/customers",
    Icon: CustomersIcon,
  },
  {
    key: "reviews",
    label: "Reviews",
    to: "/reviews",
    Icon: ReviewsIcon,
  },
  {
    key: "user-management",
    label: "User Management",
    to: "/user-management",
    Icon: UserManagementIcon,
  },
];

const isPathMatched = (pathname, targetPath = "", matchPaths = []) => {
  const pathsToMatch = matchPaths.length ? matchPaths : [targetPath];

  return pathsToMatch.some((path) => {
    if (!path) return false;
    return pathname === path || pathname.startsWith(path);
  });
};

function Sidebar({ collapsed = false, onNavigate }) {
  const location = useLocation();

  const normalizedMenu = useMemo(() => {
    return menuConfig.map((menu) => {
      const childItems =
        menu.children?.map((child) => ({
          ...child,
          isActive: isPathMatched(location.pathname, child.to, child.matchPaths),
        })) || [];

      const isParentActive = childItems.length
        ? childItems.some((child) => child.isActive)
        : isPathMatched(location.pathname, menu.to, menu.matchPaths);

      return {
        ...menu,
        isActive: isParentActive,
        children: childItems,
      };
    });
  }, [location.pathname]);

  const [openMenus, setOpenMenus] = useState(() =>
    normalizedMenu.reduce((acc, menu) => {
      if (menu.children?.length && menu.isActive) {
        acc[menu.key] = true;
      }
      return acc;
    }, {})
  );

  useEffect(() => {
    setOpenMenus((prev) => {
      const next = { ...prev };

      normalizedMenu.forEach((menu) => {
        if (menu.children?.length && menu.isActive) {
          next[menu.key] = true;
        }
      });

      return next;
    });
  }, [normalizedMenu]);

  const handleParentToggle = (menuKey) => {
    if (collapsed) {
      return;
    }

    setOpenMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const colors = {
    panel: "#ffffff",
    brand: "#1f2937",
    accent: "#57b98f",
    text: "#24324a",
    muted: "#6b7280",
    iconBg: "#eef4f1",
    line: "#d8ece3",
    activeBg: "linear-gradient(135deg, #56ba90 0%, #4aa57f 100%)",
    activeText: "#ffffff",
    childActiveBg: "#eef7f2",
    childActiveText: "#2f7d5b",
    childIconBg: "#f2f6f4",
    childIconActiveBg: "#dff3e8",
  };

  const rootStyle = {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: "18px 16px",
    background: colors.panel,
    overflow: "hidden",
  };

  const brandWrapStyle = {
    display: "grid",
    gap: 8,
    padding: collapsed ? "8px 0 0" : "10px 8px 2px",
    justifyItems: collapsed ? "center" : "stretch",
  };

  const brandCopyStyle = {
    display: "grid",
    gap: 2,
    padding: collapsed ? 0 : "0 4px 4px",
    justifyItems: collapsed ? "center" : "start",
  };

  const navStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 2,
    alignItems: collapsed ? "center" : "stretch",
  };

  const getParentItemStyle = (isActive) => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: collapsed ? 56 : "100%",
    minHeight: collapsed ? 56 : 54,
    padding: collapsed ? 0 : "0 14px",
    justifyContent: collapsed ? "center" : "flex-start",
    border: 0,
    borderRadius: collapsed ? 18 : 16,
    background: isActive ? colors.activeBg : "transparent",
    color: isActive ? colors.activeText : colors.text,
    textDecoration: "none",
    fontWeight: 700,
    textAlign: "left",
    boxShadow: isActive ? "0 10px 20px rgba(86, 186, 144, 0.18)" : "none",
    transform: isActive ? "translateX(2px)" : "none",
    transition: "all 0.2s ease",
  });

  const getParentIconWrapStyle = (isActive) => ({
    width: 32,
    height: 32,
    display: "grid",
    placeItems: "center",
    borderRadius: 10,
    background: isActive ? "rgba(255, 255, 255, 0.18)" : colors.iconBg,
    color: "currentColor",
    flexShrink: 0,
  });

  const groupWrapStyle = {
    display: "grid",
    gap: 8,
    width: "100%",
  };

  const submenuStyle = {
    display: "grid",
    gap: 6,
    marginLeft: 18,
    paddingLeft: 16,
    borderLeft: `1px solid ${colors.line}`,
  };

  const getChildItemStyle = (isActive) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    padding: "0 12px",
    borderRadius: 12,
    background: isActive ? colors.childActiveBg : "transparent",
    color: isActive ? colors.childActiveText : "#51607a",
    textDecoration: "none",
    fontWeight: 600,
    transition: "all 0.2s ease",
  });

  const getChildIconWrapStyle = (isActive) => ({
    width: 28,
    height: 28,
    display: "grid",
    placeItems: "center",
    borderRadius: 8,
    background: isActive ? colors.childIconActiveBg : colors.childIconBg,
    color: "currentColor",
    flexShrink: 0,
  });

  const iconStyle = {
    width: 18,
    height: 18,
    flexShrink: 0,
  };

  const childIconStyle = {
    width: 16,
    height: 16,
    flexShrink: 0,
  };

  return (
    <div style={rootStyle}>
      <div style={brandWrapStyle}>
        <div style={brandCopyStyle}>
          {!collapsed ? (
            <p
              style={{
                margin: 0,
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: colors.accent,
              }}
            >
              Cafe
            </p>
          ) : null}

          <h1
            style={{
              margin: 0,
              fontSize: collapsed ? "1rem" : "1.35rem",
              lineHeight: 1.15,
              color: colors.brand,
            }}
          >
            {collapsed ? "BM" : "Bagel Master"}
          </h1>
        </div>
      </div>

      <nav style={navStyle}>
        {normalizedMenu.map((menu) => {
          const hasChildren = Boolean(menu.children?.length);
          const isOpen = hasChildren ? openMenus[menu.key] || false : false;

          if (!hasChildren) {
            return (
              <NavLink
                key={menu.key}
                to={menu.to}
                style={getParentItemStyle(menu.isActive)}
                onClick={onNavigate}
                title={collapsed ? menu.label : undefined}
              >
                <span style={getParentIconWrapStyle(menu.isActive)}>
                  <menu.Icon style={iconStyle} />
                </span>
                {!collapsed ? <span>{menu.label}</span> : null}
              </NavLink>
            );
          }

          return (
            <div key={menu.key} style={groupWrapStyle}>
              <button
                type="button"
                style={getParentItemStyle(menu.isActive)}
                onClick={() => handleParentToggle(menu.key)}
                title={collapsed ? menu.label : undefined}
                aria-expanded={collapsed ? false : isOpen}
              >
                <span style={getParentIconWrapStyle(menu.isActive)}>
                  <menu.Icon style={iconStyle} />
                </span>

                {!collapsed ? (
                  <>
                    <span style={{ flex: 1 }}>{menu.label}</span>
                    <ChevronIcon open={isOpen} style={{ width: 18, height: 18, flexShrink: 0 }} />
                  </>
                ) : null}
              </button>

              {!collapsed && isOpen ? (
                <div style={submenuStyle}>
                  {menu.children.map((child) => (
                    <NavLink
                      key={child.key}
                      to={child.to}
                      style={getChildItemStyle(child.isActive)}
                      onClick={onNavigate}
                    >
                      <span style={getChildIconWrapStyle(child.isActive)}>
                        <child.Icon style={childIconStyle} />
                      </span>
                      <span>{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

export default Sidebar;
