import { getImageUrl } from "../Utils/imageUrl";

function CartDrawer({ cart, onClose, onAdd, onRemove }) {
  const total = cart.reduce((sum, item) => {
    const price =
      item.discount_price && item.discount_price < item.price
        ? item.discount_price
        : item.price;

    return sum + (Number(price) + Number(item.addon_total || 0)) * item.qty;
  }, 0);

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 200,
          animation: "fadeIn 0.2s ease",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(400px, 90vw)",
          background: "linear-gradient(180deg, #1a1a2e 0%, #0f0c29 100%)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          animation: "slideIn 0.3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              Your Cart
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "13px",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: "10px",
              width: "36px",
              height: "36px",
              color: "#fff",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {cart.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                gap: "12px",
              }}
            >
              <div style={{ fontSize: "48px" }}>🛒</div>
              <p
                style={{
                  fontSize: "15px",
                  color: "rgba(255,255,255,0.4)",
                  margin: 0,
                }}
              >
                Your cart is empty
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const price =
                item.discount_price && item.discount_price < item.price
                  ? item.discount_price
                  : item.price;
              const linePrice =
                (Number(price) + Number(item.addon_total || 0)) * item.qty;

              return (
                <div
                  key={item.cart_key || item.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    padding: "14px",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: "14px",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {getImageUrl(item, "item_image") ? (
                    <img
                      src={getImageUrl(item, "item_image")}
                      alt={item.item_name}
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "10px",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "10px",
                        background: "rgba(255,255,255,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        flexShrink: 0,
                      }}
                    >
                      🍽️
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#fff",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.item_name}
                    </h4>
                    {item.selected_addons?.length > 0 && (
                      <p
                        style={{
                          margin: "6px 0 0",
                          fontSize: "12px",
                          color: "rgba(255,255,255,0.48)",
                          lineHeight: 1.5,
                        }}
                      >
                        {item.selected_addons
                          .map((addon) => addon.addon_name)
                          .join(", ")}
                      </p>
                    )}
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#f59e0b",
                      }}
                    >
                      ₹{linePrice.toFixed(2)}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0",
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => onRemove(item.id, item.cart_key)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#fff",
                        fontSize: "15px",
                        fontWeight: 700,
                        padding: "6px 10px",
                        cursor: "pointer",
                      }}
                    >
                      −
                    </button>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#fff",
                        minWidth: "18px",
                        textAlign: "center",
                      }}
                    >
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onAdd(item)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#fff",
                        fontSize: "15px",
                        fontWeight: 700,
                        padding: "6px 10px",
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <div
            style={{
              padding: "20px 24px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <span
                style={{
                  fontSize: "15px",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Total
              </span>
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#fff",
                }}
              >
                ₹{total.toFixed(2)}
              </span>
            </div>
            <button
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                border: "none",
                borderRadius: "14px",
                color: "#fff",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
                letterSpacing: "0.5px",
              }}
            >
              Place Order
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </>
  );
}

export default CartDrawer;
