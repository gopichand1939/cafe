import { NavLink, useLocation } from "react-router-dom";

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

function Sidebar({ collapsed = false, onNavigate }) {
  const location = useLocation();
  const isCategoryMenuActive =
    location.pathname === "/category" ||
    location.pathname === "/addcategory" ||
    location.pathname.startsWith("/editcategory/") ||
    location.pathname.startsWith("/viewcategory/") ||
    location.pathname.startsWith("/deletecategory/");
  const isItemMenuActive =
    location.pathname === "/items" ||
    location.pathname === "/additem" ||
    location.pathname.startsWith("/edititem/") ||
    location.pathname.startsWith("/viewitem/") ||
    location.pathname.startsWith("/deleteitem/");
  const menuItems = [
    {
      to: "/category",
      label: "Category",
      isActive: isCategoryMenuActive,
      Icon: CategoryIcon,
    },
    {
      to: "/items",
      label: "Items",
      isActive: isItemMenuActive,
      Icon: ItemIcon,
    },
  ];

  return (
    <div className="sidebar-layout">
      <div className="sidebar-brand">
        <div className="sidebar-brand-copy">
          {!collapsed ? <p>Cafe</p> : null}
          <h1>{collapsed ? "BM" : "Bagel Master"}</h1>
        </div>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map(({ to, label, isActive, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={isActive ? "sidebar-link active" : "sidebar-link"}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
          >
            <span className="sidebar-link-icon-wrap">
              <Icon className="sidebar-link-icon" />
            </span>
            {!collapsed ? <span>{label}</span> : null}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;
