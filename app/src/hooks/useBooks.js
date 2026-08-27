import { useState, useMemo, useCallback } from 'react';
import { MOCK_BOOKS } from '../data/mockBooks';
import { loadBooks, appendBook, updateBook, softDeleteBook, ensureHeaders, ConflictError } from '../services/sheets';

const CONFLICT_MESSAGE = '此書籍已在其他裝置被更新，已為你重新載入最新資料，剛才的變更未儲存';

// 來源/標籤都支援逗號分隔多值（例如一本書同時透過「Bookwalker, 實體書」持有）
function splitMulti(str) {
  return (str || '').split(',').map(s => s.trim()).filter(Boolean);
}

export function useBooks(isAuthenticated) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState([]);
  const [filterSource, setFilterSource] = useState([]);
  const [filterTags, setFilterTags] = useState([]);
  const [filterSeries, setFilterSeries] = useState('');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [sortDir, setSortDir] = useState('desc');

  const fetchBooks = useCallback(async () => {
    if (!isAuthenticated) {
      setBooks(MOCK_BOOKS);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await ensureHeaders();
      const data = await loadBooks();
      setBooks(data);
    } catch (e) {
      setError(`載入失敗：${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const active = useMemo(() => books.filter(b => b.deleted !== 'true'), [books]);

  const filtered = useMemo(() => {
    let result = active;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        b =>
          b.title.toLowerCase().includes(q) ||
          b.authors.toLowerCase().includes(q)
      );
    }
    if (filterStatus.length > 0) {
      result = result.filter(b => filterStatus.includes(b.status));
    }
    if (filterSource.length > 0) {
      result = result.filter(b => filterSource.some(s => splitMulti(b.source).includes(s)));
    }
    if (filterTags.length > 0) {
      result = result.filter(b => filterTags.some(t => splitMulti(b.tags).includes(t)));
    }
    if (filterSeries) {
      result = result.filter(b => b.series_name === filterSeries);
    }

    return [...result].sort((a, b) => {
      if (filterSeries) {
        return a.series_order.localeCompare(b.series_order, undefined, { numeric: true });
      }
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'dateAdded') return dir * (a.dateAdded || '').localeCompare(b.dateAdded || '');
      if (sortBy === 'title') return dir * a.title.localeCompare(b.title, 'zh-Hant');
      if (sortBy === 'rating') return dir * ((a.rating || 0) - (b.rating || 0));
      return 0;
    });
  }, [active, search, filterStatus, filterSource, filterTags, filterSeries, sortBy, sortDir]);

  const stats = useMemo(() => ({
    total: active.length,
    unread: active.filter(b => b.status === '未讀').length,
    reading: active.filter(b => b.status === '閱讀中').length,
    done: active.filter(b => b.status === '已讀').length,
  }), [active]);

  const sourceCounts = useMemo(() => {
    const counts = {};
    active.forEach(b => splitMulti(b.source).forEach(s => { counts[s] = (counts[s] || 0) + 1; }));
    return counts;
  }, [active]);

  const allSources = useMemo(() =>
    Object.keys(sourceCounts).sort((a, b) => sourceCounts[b] - sourceCounts[a]),
    [sourceCounts]
  );

  const allTags = useMemo(() => {
    const set = new Set();
    active.forEach(b => splitMulti(b.tags).forEach(t => set.add(t)));
    return [...set].sort();
  }, [active]);

  const allSeries = useMemo(() =>
    [...new Set(active.filter(b => b.series_name).map(b => b.series_name))].sort(),
    [active]
  );

  const allPublishers = useMemo(() =>
    [...new Set(active.filter(b => b.publisher).map(b => b.publisher))].sort(),
    [active]
  );

  const seriesProgress = useMemo(() => {
    if (!filterSeries) return null;
    const inSeries = active.filter(b => b.series_name === filterSeries);
    return {
      done: inSeries.filter(b => b.status === '已讀').length,
      total: inSeries.length,
    };
  }, [active, filterSeries]);

  async function updateStatus(id, status) {
    const book = books.find(b => b.id === id);
    if (!book) return;
    const updated = { ...book, status };
    setBooks(prev => prev.map(b => b.id === id ? updated : b));
    if (isAuthenticated) {
      try {
        const updatedAt = await updateBook(updated);
        setBooks(prev => prev.map(b => b.id === id ? { ...b, updatedAt } : b));
      } catch (e) {
        if (e instanceof ConflictError) setError(CONFLICT_MESSAGE);
        fetchBooks();
      }
    }
  }

  async function deleteBook(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;
    setBooks(prev => prev.map(b => b.id === id ? { ...b, deleted: 'true' } : b));
    if (isAuthenticated) {
      try { await softDeleteBook(book); } catch { fetchBooks(); }
    }
  }

  // Returns a promise so callers (BookModal) can await it and keep the form
  // open on conflict instead of closing over a discarded edit.
  async function saveBook(book) {
    const isNew = !book._row;
    if (isNew) {
      const newBook = {
        ...book,
        id: crypto.randomUUID(),
        dateAdded: new Date().toISOString().slice(0, 10),
        deleted: '',
      };
      setBooks(prev => [...prev, newBook]);
      if (isAuthenticated) {
        try { await appendBook(newBook); await fetchBooks(); } catch { fetchBooks(); }
      }
    } else {
      const prevBooks = books;
      setBooks(prev => prev.map(b => b.id === book.id ? book : b));
      if (isAuthenticated) {
        try {
          const updatedAt = await updateBook(book);
          setBooks(prev => prev.map(b => b.id === book.id ? { ...b, updatedAt } : b));
        } catch (e) {
          if (e instanceof ConflictError) {
            setBooks(prevBooks);
            fetchBooks();
            throw e;
          }
          fetchBooks();
        }
      }
    }
  }

  function resetFilters() {
    setSearch('');
    setFilterStatus([]);
    setFilterSource([]);
    setFilterTags([]);
    setFilterSeries('');
  }

  const hasActiveFilters =
    !!search || filterStatus.length > 0 || filterSource.length > 0 || filterTags.length > 0 || !!filterSeries;

  return {
    active, filtered, stats, allSources, sourceCounts, allTags, allSeries, allPublishers, seriesProgress,
    loading, error, fetchBooks,
    search, setSearch,
    filterStatus, setFilterStatus,
    filterSource, setFilterSource,
    filterTags, setFilterTags,
    filterSeries, setFilterSeries,
    sortBy, setSortBy,
    sortDir, setSortDir,
    hasActiveFilters, resetFilters,
    updateStatus, deleteBook, saveBook,
  };
}
