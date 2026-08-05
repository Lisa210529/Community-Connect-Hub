export default function SearchFilter({
  search,
  onSearchChange,
  status,
  onStatusChange,
  statusOptions = [],
  placeholder = 'Search…',
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
        <input
          className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {statusOptions.length > 0 && (
        <select
          className="bg-background border border-border rounded-lg px-4 py-2.5 text-text-primary min-w-[160px]"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="all">All statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}
    </div>
  );
}
