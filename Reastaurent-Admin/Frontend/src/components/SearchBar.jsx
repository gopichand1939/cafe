function SearchBar({
  placeholder,
  searchQuery,
  onSearchChange,
  compact = false,
}) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        className={`ui-input-base shadow-[0_10px_18px_rgba(22,33,50,0.04)] ${
          compact
            ? "h-9 rounded-xl px-3 text-[0.82rem]"
            : "h-10 rounded-xl px-3.5 text-[0.88rem]"
        }`}
      />
    </div>
  );
}

export default SearchBar;
