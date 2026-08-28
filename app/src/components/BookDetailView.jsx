import { Stars, StatusPill } from './BookMeta';

function InfoPill({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-2.5 py-1 text-[11px] font-medium border border-white/10 bg-white/[0.03] text-muted-foreground hover:border-accent/40 hover:text-accent transition-colors duration-200"
    >
      {label}
    </button>
  );
}

export default function BookDetailView({ book, onEdit, onAddNext, onStatusChange, onFilterBy, onClose }) {
  const tags = (book.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const sources = (book.source || '').split(',').map(s => s.trim()).filter(Boolean);

  function filterAndClose(type, value) {
    onFilterBy(type, value);
    onClose();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-foreground">書籍資訊</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-accent">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div className="h-px bg-border" />

      <div className="flex gap-4">
        <div className="w-28 aspect-[2/3] rounded-lg overflow-hidden bg-background-alt shrink-0 flex items-center justify-center border border-border">
          {book.cover ? (
            <img src={book.cover} alt="" className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <span className="text-[10px] text-muted-foreground/50 px-2 text-center">無封面</span>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <h3 className="font-display text-base font-semibold text-foreground leading-snug">{book.title}</h3>

          {book.authors && (
            <InfoPill label={book.authors} onClick={() => filterAndClose('search', book.authors)} />
          )}

          {book.publisher && (
            <div className="text-[11px] text-muted-foreground">{book.publisher}</div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {sources.map(src => (
              <InfoPill key={src} label={src} onClick={() => filterAndClose('source', src)} />
            ))}
            {book.series_name && (
              <InfoPill
                label={book.series_name + (book.series_order ? ` · ${book.series_order}` : '')}
                onClick={() => filterAndClose('series', book.series_name)}
              />
            )}
          </div>

          <div className="flex items-center gap-3 mt-1">
            <StatusPill status={book.status} onCycle={s => onStatusChange(book.id, s)} />
            <Stars rating={book.rating} size={12} />
          </div>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <InfoPill key={tag} label={tag} onClick={() => filterAndClose('tag', tag)} />
          ))}
        </div>
      )}

      {(book.isbn || book.published_date || book.dateAdded || book.dateFinished) && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
          {book.isbn && <InfoRow label="ISBN" value={book.isbn} />}
          {book.published_date && <InfoRow label="出版日期" value={book.published_date} />}
          {book.dateAdded && <InfoRow label="加入日期" value={book.dateAdded} />}
          {book.dateFinished && <InfoRow label="完成日期" value={book.dateFinished} />}
        </div>
      )}

      {book.notes && (
        <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
          {book.notes}
        </div>
      )}

      <div className="h-px bg-border" />

      <div className="flex gap-2.5">
        <button
          onClick={onEdit}
          className="flex-1 rounded-lg bg-accent py-2.5 text-xs font-semibold text-accent-foreground hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background-alt"
        >
          編輯書籍
        </button>
        {book.series_name && (
          <button
            onClick={onAddNext}
            className="rounded-lg border border-white/15 px-4 py-2.5 text-xs text-muted-foreground hover:border-accent/40 hover:text-accent active:scale-[0.98] transition-all duration-200"
          >
            新增下一集
          </button>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground/60">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
