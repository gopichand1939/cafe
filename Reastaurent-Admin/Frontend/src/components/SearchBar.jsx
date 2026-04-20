function SearchBar({
  placeholder,
  searchQuery,
  onSearchChange,
  compact = false,
}) {
  return (
    <div className="relative">
      <span
        className={`absolute top-1/2 -translate-y-1/2 font-bold uppercase tracking-[0.12em] text-text-muted ${
          compact ? "left-3 text-[0.68rem]" : "left-4 text-[0.78rem]"
        }`}
      >
        Search
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        className={`ui-input-base shadow-[0_10px_18px_rgba(22,33,50,0.04)] ${
          compact
            ? "h-10 rounded-xl pl-[62px] pr-3 text-[0.82rem]"
            : "h-14 rounded-2xl pl-[72px]"
        }`}
      />
    </div>
  );
}

export default SearchBar;
