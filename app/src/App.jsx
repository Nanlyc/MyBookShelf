import { useState, useEffect, useRef } from 'react';
import { initAuth, signIn, signOut, getToken } from './services/auth';
import { useBooks } from './hooks/useBooks';
import { exportToCSV, downloadCSV } from './services/csvImport';
import Sidebar from './components/Sidebar';
import BookCollection from './components/BookCollection';
import BookModal from './components/BookModal';
import CsvImportModal from './components/CsvImportModal';

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const books = useBooks(isAuthenticated);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalBook, setModalBook] = useState(undefined);
  const [modalSeed, setModalSeed] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [viewMode, setViewMode] = useState('card');
  const mainRef = useRef(null);

  useEffect(() => {
    initAuth().then(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    books.fetchBooks();
  }, [isAuthenticated]);

  async function handleSignIn() {
    setAuthLoading(true);
    try {
      await signIn();
      setIsAuthenticated(!!getToken());
    } finally {
      setAuthLoading(false);
    }
  }

  function handleSignOut() {
    signOut();
    setIsAuthenticated(false);
  }

  function handleExport() {
    const csv = exportToCSV(books.active);
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `書櫃備份_${date}.csv`);
  }

  // Prefills a blank "new book" form from an existing series entry — same
  // authors/publisher/source/tags/series, series_order bumped by one where numeric.
  function handleAddNext(book) {
    const order = Number(book.series_order);
    setModalSeed({
      authors: book.authors,
      publisher: book.publisher,
      source: book.source,
      tags: book.tags,
      series_name: book.series_name,
      series_order: Number.isFinite(order) ? String(order + 1) : '',
    });
    setModalBook(null);
  }

  function closeModal() {
    setModalBook(undefined);
    setModalSeed(null);
  }

  // Clears all other filters and applies just this one, per user's chosen behavior
  // for clicking a field in the book detail view.
  function handleFilterBy(type, value) {
    books.resetFilters();
    if (type === 'search') books.setSearch(value);
    else if (type === 'source') books.setFilterSource([value]);
    else if (type === 'tag') books.setFilterTags([value]);
    else if (type === 'series') books.setFilterSeries(value);
  }

  return (
    <div className="relative h-screen flex flex-col bg-background text-foreground">
      <div className="ambient-orbs" />

      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-6 py-3.5">
        <button
          className="lg:hidden text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-accent"
          onClick={() => setSidebarOpen(o => !o)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <div className="flex items-center gap-2.5 flex-1">
          <span className="text-lg">📚</span>
          <span className="font-display text-sm font-semibold tracking-tight text-foreground">我的書櫃</span>
        </div>

        {/* View toggle — desktop only; mobile always uses card view per doc §4.3 */}
        <div className="hidden lg:flex items-center gap-0.5 rounded-lg border border-white/15 p-0.5">
          <button
            onClick={() => setViewMode('card')}
            aria-label="卡片檢視"
            className={`rounded-md p-1.5 transition-colors duration-200 ${viewMode === 'card' ? 'bg-white/10 text-accent' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            aria-label="列表檢視"
            className={`rounded-md p-1.5 transition-colors duration-200 ${viewMode === 'list' ? 'bg-white/10 text-accent' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setModalBook(null); setModalSeed(null); }}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              + 新增書籍
            </button>
            <button
              onClick={handleSignOut}
              className="ml-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-accent"
            >
              登出
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            disabled={!authReady || authLoading}
            className="rounded-lg border border-white/15 px-4 py-1.5 text-xs font-medium text-foreground hover:bg-white/5 hover:border-white/25 active:scale-[0.98] disabled:opacity-40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {authLoading ? '登入中...' : '以 Google 登入'}
          </button>
        )}
      </header>

      {/* Error banner */}
      {books.error && (
        <div className="border-b border-red-900/50 bg-red-950/40 px-6 py-2.5 text-xs text-red-400 flex items-center gap-3">
          {books.error}
          <button onClick={books.fetchBooks} className="underline underline-offset-2 hover:text-red-300">重試</button>
        </div>
      )}

      <div className="relative z-10 flex flex-1 min-h-0 overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <div className={`
          fixed z-20 top-0 left-0 h-full w-64 bg-background-alt border-r border-border pt-16 overflow-y-auto transition-transform duration-200
          lg:static lg:translate-x-0 lg:pt-0 lg:z-auto lg:h-auto lg:flex-none lg:w-56 lg:bg-transparent
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar
            stats={books.stats}
            allSources={books.allSources}
            sourceCounts={books.sourceCounts}
            allTags={books.allTags}
            allSeries={books.allSeries}
            search={books.search} setSearch={books.setSearch}
            filterStatus={books.filterStatus} setFilterStatus={books.setFilterStatus}
            filterSource={books.filterSource} setFilterSource={books.setFilterSource}
            filterTags={books.filterTags} setFilterTags={books.setFilterTags}
            filterSeries={books.filterSeries} setFilterSeries={books.setFilterSeries}
            sortBy={books.sortBy} setSortBy={books.setSortBy}
            sortDir={books.sortDir} setSortDir={books.setSortDir}
            hasActiveFilters={books.hasActiveFilters}
            resetFilters={books.resetFilters}
            onExport={handleExport}
            exportDisabled={books.active.length === 0}
            onImport={isAuthenticated ? () => setShowImport(true) : undefined}
          />
        </div>

        {/* Main */}
        <main ref={mainRef} className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8">
          {books.loading ? (
            <div className="flex items-center justify-center py-32 text-muted-foreground text-sm">
              載入中...
            </div>
          ) : !isAuthenticated ? (
            <div className="flex flex-col items-center gap-5 pb-6">
              <div className="w-full rounded-xl border border-border bg-muted/60 backdrop-blur-sm px-5 py-4 text-xs text-muted-foreground text-center">
                以 Google 登入後即可讀取書櫃資料 · 以下為示範資料
              </div>
              <BookCollection
                books={books.filtered}
                viewMode={viewMode}
                scrollElementRef={mainRef}
                onStatusChange={books.updateStatus}
                onBookClick={book => setModalBook(book)}
                seriesProgress={books.seriesProgress}
              />
            </div>
          ) : (
            <BookCollection
              books={books.filtered}
              viewMode={viewMode}
              scrollElementRef={mainRef}
              onStatusChange={books.updateStatus}
              onBookClick={book => setModalBook(book)}
              seriesProgress={books.seriesProgress}
            />
          )}
        </main>
      </div>

      {modalBook !== undefined && (
        <BookModal
          book={modalBook}
          seed={modalSeed}
          allSeries={books.allSeries}
          allSources={books.allSources}
          allPublishers={books.allPublishers}
          onSave={books.saveBook}
          onDelete={books.deleteBook}
          onStatusChange={books.updateStatus}
          onFilterBy={handleFilterBy}
          onAddNext={handleAddNext}
          onClose={closeModal}
        />
      )}

      {showImport && (
        <CsvImportModal
          existingBooks={books.filtered}
          onDone={() => { setShowImport(false); books.fetchBooks(); }}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
