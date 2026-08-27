import { Stars, StatusPill } from './BookMeta';

export default function BookListRow({ book, onStatusChange, onClick }) {
  return (
    <div
      className="group flex items-center gap-4 h-full px-4 border-b border-border cursor-pointer hover:bg-white/[0.03] transition-colors duration-150"
      onClick={() => onClick(book)}
    >
      <div className="w-8 h-11 rounded-md bg-background-alt overflow-hidden shrink-0 flex items-center justify-center">
        {book.cover ? (
          <img src={book.cover} alt="" loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[9px] text-muted-foreground/40">—</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground truncate">{book.title}</div>
        {book.authors && <div className="text-[11px] text-muted-foreground truncate">{book.authors}</div>}
      </div>

      <div className="hidden sm:block w-32 shrink-0 text-[11px] text-accent truncate">
        {book.series_name ? `${book.series_name}${book.series_order ? ` · ${book.series_order}` : ''}` : ''}
      </div>

      <div className="hidden md:block w-24 shrink-0 text-[11px] text-muted-foreground truncate">
        {book.source}
      </div>

      <div className="hidden lg:flex w-24 shrink-0"><Stars rating={book.rating} /></div>

      <div className="w-20 shrink-0 flex justify-end">
        <StatusPill status={book.status} onCycle={s => onStatusChange(book.id, s)} />
      </div>
    </div>
  );
}
