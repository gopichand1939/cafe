import { useState } from "react";
import { getImageUrl } from "../../Utils/imageUrl";

function CategoryBar({ categories, selectedCategory, onSelect, loading }) {
  const [hoveredId, setHoveredId] = useState(null);

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto px-4 py-5 sm:px-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-[110px] min-w-[100px] animate-pulse rounded-2xl bg-white/[0.05]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 pb-2 pt-5 sm:px-6">
      <h2 className="mb-[14px] text-base font-semibold uppercase tracking-[1.5px] text-white/50">
        Categories
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const isHovered = hoveredId === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              onMouseEnter={() => setHoveredId(cat.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`flex min-w-[110px] flex-shrink-0 scale-100 cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 px-3 py-3.5 transition-all duration-300 ${
                isSelected
                  ? "scale-105 border-amber-500 bg-gradient-to-br from-amber-500/20 to-red-500/15 shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
                  : isHovered
                    ? "scale-[1.02] border-white/10 bg-white/[0.08]"
                    : "border-white/10 bg-white/[0.04]"
              }`}
            >
              {getImageUrl(cat, "category_image") ? (
                <img
                  src={getImageUrl(cat, "category_image")}
                  alt={cat.category_name}
                  loading="lazy"
                  decoding="async"
                  className="h-12 w-12 rounded-xl object-cover"
                />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-red-500 text-[22px]">
                  🍴
                </div>
              )}
              <span
                className={`max-w-[90px] truncate text-center text-xs ${
                  isSelected ? "font-bold text-amber-400" : "font-medium text-white/70"
                }`}
              >
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
