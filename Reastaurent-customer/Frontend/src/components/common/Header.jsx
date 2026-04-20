import { useState } from "react";

function Header({
  cartCount,
  onCartClick,
  onCustomerClick,
  onNotificationClick,
  customer,
  notificationCount = 0,
}) {
  const [hovered, setHovered] = useState(false);
  const [customerHovered, setCustomerHovered] = useState(false);
  const [notificationHovered, setNotificationHovered] = useState(false);

  const pillBaseClass =
    "relative flex items-center gap-2 rounded-2xl border border-white/10 px-3.5 py-2.5 text-white transition-all duration-300";

  return (
    <header className="sticky top-0 z-[100] flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-red-500 text-xl font-extrabold text-white">
          F
        </div>
        <div>
          <h1 className="m-0 bg-gradient-to-r from-amber-500 to-red-500 bg-clip-text text-xl font-bold tracking-[-0.5px] text-transparent">
            Flavour Hub
          </h1>
          <p className="m-0 text-[11px] uppercase tracking-[2px] text-white/40">
            Delicious meals delivered
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onCustomerClick}
          onMouseEnter={() => setCustomerHovered(true)}
          onMouseLeave={() => setCustomerHovered(false)}
          className={`${pillBaseClass} max-w-[220px] ${
            customerHovered
              ? "bg-gradient-to-br from-amber-500/95 to-red-500/90 shadow-warm"
              : "bg-white/[0.08]"
          }`}
        >
          <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-white/15 font-extrabold text-white">
            {customer?.name ? customer.name.slice(0, 1).toUpperCase() : "U"}
          </span>
          <span className="truncate text-sm font-semibold">
            {customer?.name || "Sign In"}
          </span>
        </button>

        <button
          onClick={onNotificationClick}
          onMouseEnter={() => setNotificationHovered(true)}
          onMouseLeave={() => setNotificationHovered(false)}
          className={`${pillBaseClass} ${
            notificationHovered
              ? "bg-gradient-to-br from-amber-500/95 to-red-500/90 shadow-warm"
              : "bg-white/[0.08]"
          }`}
        >
          <span className="text-[15px]">N</span>
          <span className="text-sm font-semibold">Alerts</span>
          {notificationCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-[0_2px_8px_rgba(239,68,68,0.5)]">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          ) : null}
        </button>

        <button
          onClick={onCartClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`${pillBaseClass} px-4 ${
            hovered
              ? "bg-gradient-to-br from-amber-500 to-red-500 shadow-warm"
              : "bg-white/[0.08]"
          }`}
        >
          <span className="text-[15px]">C</span>
          <span className="text-sm font-semibold">Cart</span>
          {cartCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white shadow-[0_2px_8px_rgba(239,68,68,0.5)]">
              {cartCount}
            </span>
          ) : null}
        </button>
      </div>
    </header>
  );
}

export default Header;
