import { useRef, useState, useLayoutEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import BookCard from './BookCard';
import BookListRow from './BookListRow';

const ROW_HEIGHT = 56;

export default function BookCollection({ books, viewMode, onStatusChange, onBookClick, seriesProgress, scrollElementRef }) {
  const listRef = useRef(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    if (viewMode === 'list' && listRef.current) setScrollMargin(listRef.current.offsetTop);
  }, [viewMode, seriesProgress]);

  const rowVirtualizer = useVirtualizer({
    count: books.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
    enabled: viewMode === 'list',
    // Offsets the list container's own position within the shared scroll element,
    // so virtual item offsets line up even when other content (filters bar, series
    // progress) sits above the list inside the same scrollable <main>.
    scrollMargin,
  });

  return (
    <div className="flex flex-col gap-5 w-full">
      {seriesProgress && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-accent font-medium">系列進度</span>
          <span>已讀 {seriesProgress.done} / {seriesProgress.total} 集</span>
          <div className="flex-1 h-px bg-border ml-1" />
          <span className="text-muted-foreground/60">
            {Math.round((seriesProgress.done / seriesProgress.total) * 100)}%
          </span>
        </div>
      )}

      {books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-muted-foreground/60">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          <span className="text-sm">沒有符合條件的書籍</span>
        </div>
      ) : viewMode === 'list' ? (
        <div ref={listRef} className="w-full rounded-lg border border-border bg-muted/40 backdrop-blur-sm overflow-hidden">
          <div
            style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}
          >
            {rowVirtualizer.getVirtualItems().map(vRow => (
              <div
                key={books[vRow.index].id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: vRow.size,
                  transform: `translateY(${vRow.start - scrollMargin}px)`,
                }}
              >
                <BookListRow
                  book={books[vRow.index]}
                  onStatusChange={onStatusChange}
                  onClick={onBookClick}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
          {books.map(book => (
            <BookCard
              key={book.id}
              book={book}
              onStatusChange={onStatusChange}
              onClick={onBookClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
