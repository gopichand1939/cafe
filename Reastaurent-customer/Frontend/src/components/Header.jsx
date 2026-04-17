import { useState } from "react";

function Header({ cartCount, onCartClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 24px",
      background: "rgba(255,255,255,0.04)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo / Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, #f59e0b, #ef4444)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
        }}>
          🍽️
        </div>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: 700,
            background: "linear-gradient(90deg, #f59e0b, #ef4444)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.5px",
          }}>
            Flavour Hub
          </h1>
          <p style={{
            margin: 0,
            fontSize: "11px",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}>
            Delicious meals delivered
          </p>
        </div>
      </div>

      {/* Cart Button */}
      <button
        onClick={onCartClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "relative",
          background: hovered
            ? "linear-gradient(135deg, #f59e0b, #ef4444)"
            : "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "14px",
          padding: "10px 18px",
          color: "#fff",
          fontSize: "15px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "all 0.3s ease",
        }}
      >
        🛒
        <span style={{ fontWeight: 600 }}>Cart</span>
        {cartCount > 0 && (
          <span style={{
            position: "absolute",
            top: "-6px",
            right: "-6px",
            background: "#ef4444",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 700,
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(239,68,68,0.5)",
          }}>
            {cartCount}
          </span>
        )}
      </button>
    </header>
  );
}

export default Header;
