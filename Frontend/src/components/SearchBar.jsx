function SearchBar({ placeholder, searchQuery, onSearchChange }) {
  return (
    <div className="relative">
      <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[0.78rem] font-bold text-slate-500">
        Search
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        className="h-[52px] w-full rounded-[8px] border border-slate-300 px-4 pl-[72px] outline-none"
      />
    </div>
  );
}

export default SearchBar;
