import { useEffect, useMemo, useState } from "react";
import { getImageUrl } from "../Utils/imageUrl";

function AddonModal({ item, addons, loading, onClose, onConfirm }) {
  const [selectedAddons, setSelectedAddons] = useState([]);

  useEffect(() => {
    setSelectedAddons([]);
  }, [item?.id]);

  const groupedAddons = useMemo(() => {
    return addons.reduce((groups, addon) => {
      if (!groups[addon.addon_group]) {
        groups[addon.addon_group] = [];
      }
      groups[addon.addon_group].push(addon);
      return groups;
    }, {});
  }, [addons]);

  const basePrice =
    item?.discount_price && Number(item.discount_price) < Number(item.price)
      ? Number(item.discount_price)
      : Number(item?.price || 0);

  const addonTotal = selectedAddons.reduce(
    (sum, addon) => sum + Number(addon.addon_price || 0),
    0
  );

  const totalPrice = (basePrice + addonTotal).toFixed(2);

  const toggleAddon = (addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((selected) => selected.id === addon.id);
      if (exists) {
        return prev.filter((selected) => selected.id !== addon.id);
      }
      return [...prev, addon];
    });
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(2, 6, 23, 0.72)",
          backdropFilter: "blur(6px)",
          zIndex: 300,
        }}
      />

      <div
        style={{
          position: "fixed",
          inset: "50% auto auto 50%",
          transform: "translate(-50%, -50%)",
          width: "min(680px, calc(100vw - 32px))",
          height: "min(84vh, 760px)",
          background:
            "linear-gradient(180deg, rgba(26,26,46,0.98) 0%, rgba(15,12,41,0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px",
          zIndex: 301,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            padding: "22px 24px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              Customize Item
            </p>
            <h2
              style={{
                margin: "6px 0 0",
                fontSize: "24px",
                fontWeight: 800,
                color: "#fff",
              }}
            >
              {item?.item_name}
            </h2>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: "13px",
                color: "rgba(255,255,255,0.52)",
              }}
            >
              Pick the add-ons you want for this item.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: "12px",
              width: "40px",
              height: "40px",
              color: "#fff",
              fontSize: "18px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: "20px 24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            flex: 1,
            minHeight: 0,
          }}
        >
          {getImageUrl(item, "item_image") && (
            <img
              src={getImageUrl(item, "item_image")}
              alt={item.item_name}
              style={{
                width: "100%",
                height: "min(220px, 28vh)",
                objectFit: "cover",
                borderRadius: "18px",
                border: "1px solid rgba(255,255,255,0.08)",
                flexShrink: 0,
              }}
            />
          )}

          {loading ? (
            <div
              style={{
                padding: "32px 0",
                textAlign: "center",
                color: "rgba(255,255,255,0.55)",
                fontSize: "15px",
              }}
            >
              Loading add-ons...
            </div>
          ) : addons.length === 0 ? (
            <div
              style={{
                padding: "20px 0",
                textAlign: "center",
                color: "rgba(255,255,255,0.55)",
                fontSize: "15px",
              }}
            >
              No add-ons available for this item.
            </div>
          ) : (
            Object.entries(groupedAddons).map(([groupName, groupAddons]) => (
              <div
                key={groupName}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "18px",
                  padding: "16px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {groupName}
                </h3>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginTop: "14px",
                  }}
                >
                  {groupAddons.map((addon) => {
                    const isSelected = selectedAddons.some(
                      (selected) => selected.id === addon.id
                    );

                    return (
                      <button
                        key={addon.id}
                        onClick={() => toggleAddon(addon)}
                        style={{
                          background: isSelected
                            ? "linear-gradient(135deg, rgba(245,158,11,0.22), rgba(239,68,68,0.18))"
                            : "rgba(255,255,255,0.03)",
                          border: isSelected
                            ? "1px solid rgba(245,158,11,0.55)"
                            : "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "14px",
                          color: "#fff",
                          padding: "14px 16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                            }}
                          >
                            {addon.addon_name}
                          </div>
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "12px",
                              color: "rgba(255,255,255,0.45)",
                            }}
                          >
                            {isSelected ? "Selected" : "Tap to add"}
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 800,
                            color: "#fbbf24",
                          }}
                        >
                          +₹{Number(addon.addon_price || 0).toFixed(2)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            padding: "18px 24px 24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexShrink: 0,
            background: "rgba(18, 16, 47, 0.98)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.45)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Total
            </div>
            <div
              style={{
                marginTop: "4px",
                fontSize: "26px",
                fontWeight: 800,
                color: "#fff",
              }}
            >
              ₹{totalPrice}
            </div>
          </div>

          <button
            onClick={() => onConfirm(selectedAddons)}
            style={{
              background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              border: "none",
              borderRadius: "16px",
              padding: "14px 22px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 10px 24px rgba(245,158,11,0.24)",
            }}
          >
            Add Item
          </button>
        </div>
      </div>
    </>
  );
}

export default AddonModal;
