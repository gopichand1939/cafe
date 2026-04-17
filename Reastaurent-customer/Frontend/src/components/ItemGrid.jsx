import { useState } from "react";
import { getImageUrl } from "../Utils/imageUrl";

function ItemCard({
  item,
  onAddToCart,
  onOpenAddons,
  cartQty,
  onRemoveFromCart,
}) {
  const [hovered, setHovered] = useState(false);
  const hasDiscount = item.discount_price && item.discount_price < item.price;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "rgba(255,255,255,0.08)"
          : "rgba(255,255,255,0.04)",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
        transition: "all 0.3s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 12px 40px rgba(0,0,0,0.3)"
          : "0 2px 8px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <button
        onClick={() => onOpenAddons(item)}
        style={{
          position: "relative",
          overflow: "hidden",
          padding: 0,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {getImageUrl(item, "item_image") ? (
          <img
            src={getImageUrl(item, "item_image")}
            alt={item.item_name}
            style={{
              width: "100%",
              height: "180px",
              objectFit: "cover",
              transition: "transform 0.4s ease",
              transform: hovered ? "scale(1.08)" : "scale(1)",
            }}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "180px",
              background: "linear-gradient(135deg, #1a1a2e, #16213e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "48px",
            }}
          >
            🍽️
          </div>
        )}

        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          {item.is_new === 1 && (
            <span
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                color: "#fff",
                fontSize: "10px",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "20px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              New
            </span>
          )}
          {item.is_popular === 1 && (
            <span
              style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#fff",
                fontSize: "10px",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "20px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Popular
            </span>
          )}
          {hasDiscount && (
            <span
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "#fff",
                fontSize: "10px",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "20px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {Math.round(((item.price - item.discount_price) / item.price) * 100)}%
              OFF
            </span>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            width: "24px",
            height: "24px",
            borderRadius: "6px",
            border: `2px solid ${item.is_veg === 1 ? "#22c55e" : "#ef4444"}`,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: item.is_veg === 1 ? "#22c55e" : "#ef4444",
            }}
          />
        </div>
      </button>

      <div
        style={{
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          flex: 1,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.3,
          }}
        >
          {item.item_name}
        </h3>

        {item.item_description && (
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "rgba(255,255,255,0.45)",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.item_description}
          </p>
        )}

        {item.preparation_time && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            ⏱️ {item.preparation_time} min
          </div>
        )}

        <button
          onClick={() => onOpenAddons(item)}
          style={{
            alignSelf: "flex-start",
            background: "transparent",
            border: "none",
            color: "#fbbf24",
            fontSize: "12px",
            fontWeight: 700,
            padding: 0,
            cursor: "pointer",
          }}
        >
          Tap image to customize
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: "8px",
          }}
        >
          <div>
            {hasDiscount ? (
              <>
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#22c55e",
                  }}
                >
                  ₹{item.discount_price}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.35)",
                    textDecoration: "line-through",
                    marginLeft: "6px",
                  }}
                >
                  ₹{item.price}
                </span>
              </>
            ) : (
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#fff",
                }}
              >
                ₹{item.price}
              </span>
            )}
          </div>

          {cartQty > 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0",
                background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => onRemoveFromCart(item.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: 700,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                −
              </button>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#fff",
                  minWidth: "20px",
                  textAlign: "center",
                }}
              >
                {cartQty}
              </span>
              <button
                onClick={() => onAddToCart(item)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: 700,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(item)}
              style={{
                background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                border: "none",
                borderRadius: "12px",
                padding: "8px 18px",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
              }}
            >
              ADD
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemGrid({
  items,
  loading,
  onAddToCart,
  onOpenAddons,
  cart,
  onRemoveFromCart,
}) {
  if (loading) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "20px",
          padding: "20px 24px",
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              height: "320px",
              borderRadius: "20px",
              background: "rgba(255,255,255,0.04)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 24px",
          gap: "12px",
        }}
      >
        <div style={{ fontSize: "48px" }}>🍽️</div>
        <p
          style={{
            fontSize: "16px",
            color: "rgba(255,255,255,0.4)",
            margin: 0,
          }}
        >
          No items available in this category
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "20px",
        padding: "20px 24px 100px",
      }}
    >
      {items.map((item) => {
        const cartQty = cart
          .filter((cartItem) => cartItem.id === item.id)
          .reduce((sum, cartItem) => sum + cartItem.qty, 0);

        return (
          <ItemCard
            key={item.id}
            item={item}
            onAddToCart={onAddToCart}
            onOpenAddons={onOpenAddons}
            cartQty={cartQty}
            onRemoveFromCart={onRemoveFromCart}
          />
        );
      })}
    </div>
  );
}

export default ItemGrid;
