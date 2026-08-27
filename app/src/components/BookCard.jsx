import { Stars, StatusPill } from './BookMeta';

export default function BookCard({ book, onStatusChange, onClick }) {
  return (
    <div
      className="group flex flex-col rounded-lg border border-border bg-muted/60 backdrop-blur-sm overflow-hidden cursor-pointer hover:border-white/15 hover:bg-muted/80 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 ease-out"
      onClick={() => onClick(book)}
    >
      {/* Cover */}
      <div className="aspect-[2/3] bg-background-alt flex items-center justify-center overflow-hidden relative">
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ display: book.cover ? 'none' : 'flex' }}
        >
          <div className="text-center px-2">
            <div className="text-xs font-medium text-muted-foreground line-clamp-3 leading-relaxed">
              {book.title}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <div className="text-xs font-medium text-foreground leading-snug line-clamp-2">{book.title}</div>
        {book.authors && (
          <div className="text-[11px] text-muted-foreground truncate">{book.authors}</div>
        )}
        {book.series_name && (
          <div className="text-[11px] text-accent truncate">
            {book.series_name}{book.series_order ? ` · ${book.series_order}` : ''}
          </div>
        )}
        <div className="mt-0.5"><Stars rating={book.rating} /></div>
        <div className="mt-1">
          <StatusPill status={book.status} onCycle={s => onStatusChange(book.id, s)} />
        </div>
      </div>
    </div>
  );
}
