import { useState } from "react";
import { getImageUrl } from "../Utils/imageUrl";

function CategoryBar({ categories, selectedCategory, onSelect, loading }) {
  const [hoveredId, setHoveredId] = useState(null);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        gap: "12px",
        padding: "20px 24px",
        overflowX: "auto",
      }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{
            minWidth: "100px",
            height: "110px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.05)",
            animation: "pulse 1.5s ease-in-out infinite",
          }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{
      padding: "20px 24px 8px",
    }}>
      <h2 style={{
        margin: "0 0 14px 0",
        fontSize: "16px",
        fontWeight: 600,
        color: "rgba(255,255,255,0.5)",
        textTransform: "uppercase",
        letterSpacing: "1.5px",
      }}>
        Categories
      </h2>
      <div style={{
        display: "flex",
        gap: "12px",
        overflowX: "auto",
        paddingBottom: "12px",
        scrollbarWidth: "none",
      }}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const isHovered = hoveredId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              onMouseEnter={() => setHoveredId(cat.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                minWidth: "110px",
                padding: "14px 12px",
                borderRadius: "16px",
                border: isSelected
                  ? "2px solid #f59e0b"
                  : "2px solid rgba(255,255,255,0.08)",
                background: isSelected
                  ? "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.15))"
                  : isHovered
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(255,255,255,0.04)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
                transform: isSelected ? "scale(1.05)" : isHovered ? "scale(1.02)" : "scale(1)",
                boxShadow: isSelected
                  ? "0 4px 20px rgba(245,158,11,0.2)"
                  : "none",
                flexShrink: 0,
              }}
            >
              {getImageUrl(cat, "category_image") ? (
                <img
                  src={getImageUrl(cat, "category_image")}
                  alt={cat.category_name}
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    objectFit: "cover",
                  }}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                }}>
                  🍴
                </div>
              )}
              <span style={{
                fontSize: "12px",
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? "#f59e0b" : "rgba(255,255,255,0.7)",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "90px",
              }}>
                {cat.category_name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryBar;
