const STATUS_OPTIONS = ['未讀', '閱讀中', '已讀'];

function toggle(arr, val) {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

export default function Sidebar({
  stats, allSources, sourceCounts, allTags, allSeries,
  search, setSearch,
  filterStatus, setFilterStatus,
  filterSource, setFilterSource,
  filterTags, setFilterTags,
  filterSeries, setFilterSeries,
  sortBy, setSortBy,
  sortDir, setSortDir,
  hasActiveFilters, resetFilters,
  onExport, exportDisabled, onImport,
}) {
  return (
    <aside className="flex flex-col gap-6 p-5 text-sm h-full">

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-2.5 top-2.5 text-muted-foreground" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="搜尋書名、作者"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-muted/60 backdrop-blur-sm pl-8 pr-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 focus:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all duration-200"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-1.5">
        <Stat label="全部" value={stats.total} />
        <Stat label="未讀" value={stats.unread} />
        <Stat label="閱讀中" value={stats.reading} />
        <Stat label="已讀" value={stats.done} />
      </div>

      <div className="w-full h-px bg-border" />

      {/* Status filter */}
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">篩選</div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-[11px] text-accent hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:underline"
          >
            清除篩選
          </button>
        )}
      </div>

      <Section title="狀態">
        {STATUS_OPTIONS.map(s => (
          <FilterItem
            key={s}
            label={s}
            checked={filterStatus.includes(s)}
            onChange={() => setFilterStatus(toggle(filterStatus, s))}
          />
        ))}
      </Section>

      {/* Source filter */}
      {allSources.length > 0 && (
        <Section title="來源">
          {allSources.map(src => (
            <FilterItem
              key={src}
              label={src}
              count={sourceCounts[src]}
              checked={filterSource.includes(src)}
              onChange={() => setFilterSource(toggle(filterSource, src))}
            />
          ))}
        </Section>
      )}

      {/* Tags filter */}
      {allTags.length > 0 && (
        <Section title="標籤">
          <div className="flex flex-wrap gap-1.5">
            {allTags.map(tag => (
              <TagPill
                key={tag}
                label={tag}
                checked={filterTags.includes(tag)}
                onClick={() => setFilterTags(toggle(filterTags, tag))}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Series filter */}
      {allSeries.length > 0 && (
        <Section title="系列">
          <select
            value={filterSeries}
            onChange={e => setFilterSeries(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/60 backdrop-blur-sm px-2.5 py-2 text-xs text-foreground outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all duration-200"
          >
            <option value="">全部系列</option>
            {allSeries.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Section>
      )}

      <div className="w-full h-px bg-border" />

      {/* Sort */}
      <Section title="排序">
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-muted/60 backdrop-blur-sm px-2.5 py-2 text-xs text-foreground outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all duration-200"
          >
            <option value="dateAdded">新增日期</option>
            <option value="title">書名</option>
            <option value="rating">評分</option>
          </select>
          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            aria-label={sortDir === 'asc' ? '升序，點擊切換為降序' : '降序，點擊切換為升序'}
            title={sortDir === 'asc' ? '升序' : '降序'}
            className="shrink-0 rounded-lg border border-border bg-muted/60 backdrop-blur-sm px-2.5 text-muted-foreground hover:text-accent hover:border-accent/40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transform: sortDir === 'asc' ? 'scaleY(-1)' : 'none', transition: 'transform 200ms' }}
            >
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </button>
        </div>
      </Section>

      {(onImport || onExport) && (
        <>
          <div className="w-full h-px bg-border" />

          {/* Data management */}
          <Section title="資料">
            <div className="flex flex-col gap-2">
              {onImport && (
                <button
                  onClick={onImport}
                  className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 text-xs font-medium text-foreground hover:bg-white/5 hover:border-white/25 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background-alt"
                >
                  匯入 CSV
                </button>
              )}
              {onExport && (
                <button
                  onClick={onExport}
                  disabled={exportDisabled}
                  className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 text-xs font-medium text-foreground hover:bg-white/5 hover:border-white/25 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background-alt"
                >
                  匯出 CSV
                </button>
              )}
            </div>
          </Section>
        </>
      )}
    </aside>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-muted/60 backdrop-blur-sm px-3 py-2.5">
      <div className="font-display text-lg font-semibold text-foreground leading-none">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function TagPill({ label, checked, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all duration-200
        ${checked
          ? 'bg-accent/15 border-accent/30 text-accent shadow-[0_0_12px_rgba(245,158,11,0.15)]'
          : 'bg-white/[0.03] border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground'}`}
    >
      {label}
    </button>
  );
}

function FilterItem({ label, count, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0
        ${checked ? 'bg-accent border-accent' : 'border-white/15 group-hover:border-white/30'}`}
      >
        {checked && (
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#0A0A0F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span className={`text-xs transition-colors ${checked ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
        {label}{count != null && <span className="text-muted-foreground/60"> ({count})</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  );
}
