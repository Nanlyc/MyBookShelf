import { useState, useEffect, useRef } from 'react';
import { lookupByIsbn } from '../services/bookLookup';
import { uploadCover } from '../services/upload';
import BookDetailView from './BookDetailView';

const EMPTY_BOOK = {
  title: '', authors: '', publisher: '', source: '', status: '未讀',
  tags: '', isbn: '', published_date: '', cover: '', rating: '',
  notes: '', dateFinished: '', series_name: '', series_order: '', updatedAt: '',
};

export default function BookModal({ book, allSeries, allSources, allPublishers, onSave, onDelete, onClose, onStatusChange, onFilterBy }) {
  const [form, setForm] = useState(EMPTY_BOOK);
  const [mode, setMode] = useState(book ? 'view' : 'edit'); // 'view' | 'edit'
  const [coverLoading, setCoverLoading] = useState(false);
  const [uploadState, setUploadState] = useState(null); // null | 'loading' | 'error'
  const [uploadError, setUploadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const fileRef = useRef();
  const isNew = !book;

  useEffect(() => {
    setForm(book ? { ...book } : EMPTY_BOOK);
    setMode(book ? 'view' : 'edit');
    setConflict(false);
  }, [book]);

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleLookupCover() {
    if (!form.isbn.trim() || coverLoading) return;
    setCoverLoading(true);
    try {
      const result = await lookupByIsbn(form.isbn);
      if (result) {
        setForm(f => ({
          ...f,
          cover: result.cover || f.cover,
          title: f.title.trim() ? f.title : (result.title || f.title),
          authors: f.authors.trim() ? f.authors : (result.authors || f.authors),
          publisher: f.publisher.trim() ? f.publisher : (result.publisher || f.publisher),
          published_date: f.published_date.trim() ? f.published_date : (result.published_date || f.published_date),
        }));
      }
    } finally {
      setCoverLoading(false);
    }
  }

  function handleIsbnBlur() {
    if (form.isbn.trim() && !form.cover.trim()) handleLookupCover();
  }

  async function handleFileSelect(e) {
    const file = e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setUploadState('loading');
    setUploadError('');
    try {
      const url = await uploadCover(file);
      set('cover', url);
      setUploadState(null);
    } catch (err) {
      setUploadState('error');
      setUploadError(err.message);
    }
  }

  async function handleSave() {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    setConflict(false);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      if (e?.name === 'ConflictError') setConflict(true);
    } finally {
      setSaving(false);
    }
  }

  if (mode === 'view') {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
        <div
          className="w-full max-w-lg rounded-2xl border border-border bg-background-alt/95 backdrop-blur-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <BookDetailView
            book={book}
            onEdit={() => setMode('edit')}
            onStatusChange={onStatusChange}
            onFilterBy={onFilterBy}
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-background-alt/95 backdrop-blur-md p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-foreground">{isNew ? '新增書籍' : '編輯書籍'}</h2>
          <button onClick={() => isNew ? onClose() : setMode('view')} className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-accent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="h-px bg-border" />

        <Field label="書名 *">
          <input className={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="書名" />
        </Field>
        <Field label="作者">
          <input className={inp} value={form.authors} onChange={e => set('authors', e.target.value)} placeholder="作者名稱" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="出版社">
            <input className={inp} list="publisher-list" value={form.publisher} onChange={e => set('publisher', e.target.value)} />
            <datalist id="publisher-list">
              {allPublishers.map(p => <option key={p} value={p} />)}
            </datalist>
          </Field>
          <Field label="來源（可複選，逗號分隔）">
            <input className={inp} list="source-list" value={form.source} onChange={e => set('source', e.target.value)} placeholder="實體書, Bookwalker..." />
            <datalist id="source-list">
              {allSources.map(s => <option key={s} value={s} />)}
            </datalist>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="狀態">
            <select className={inp} value={form.status} onChange={e => set('status', e.target.value)}>
              <option>未讀</option>
              <option>閱讀中</option>
              <option>已讀</option>
            </select>
          </Field>
          <Field label="評分">
            <select className={inp} value={form.rating ?? ''} onChange={e => set('rating', e.target.value ? Number(e.target.value) : null)}>
              <option value="">—</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{'★'.repeat(n)} {n} 星</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="系列名稱">
            <input
              className={inp}
              list="series-list"
              value={form.series_name}
              onChange={e => set('series_name', e.target.value)}
              placeholder="系列名稱"
            />
            <datalist id="series-list">
              {allSeries.map(s => <option key={s} value={s} />)}
            </datalist>
          </Field>
          <Field label="集數">
            <input className={inp} value={form.series_order} onChange={e => set('series_order', e.target.value)} placeholder="1 / 1.5 / 外傳" />
          </Field>
        </div>

        <Field label="ISBN">
          <div className="flex gap-2">
            <input
              className={inp}
              value={form.isbn}
              onChange={e => set('isbn', e.target.value)}
              onBlur={handleIsbnBlur}
              placeholder="9789..."
            />
            <button
              type="button"
              onClick={handleLookupCover}
              disabled={!form.isbn.trim() || coverLoading}
              className="shrink-0 rounded-lg border border-white/15 px-3 text-[11px] font-medium text-muted-foreground hover:border-accent/40 hover:text-accent disabled:opacity-40 disabled:pointer-events-none transition-colors duration-200"
            >
              {coverLoading ? '查詢中...' : '查詢封面'}
            </button>
          </div>
        </Field>
        <Field label="封面圖網址">
          <div className="flex gap-3 items-start">
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="flex gap-2">
                <input className={inp} value={form.cover} onChange={e => set('cover', e.target.value)} placeholder="https://... 或下方上傳圖片" />
                <button
                  type="button"
                  onClick={() => fileRef.current.click()}
                  disabled={uploadState === 'loading'}
                  className="shrink-0 rounded-lg border border-white/15 px-3 text-[11px] font-medium text-muted-foreground hover:border-accent/40 hover:text-accent disabled:opacity-40 disabled:pointer-events-none transition-colors duration-200"
                >
                  {uploadState === 'loading' ? '上傳中...' : '上傳圖片'}
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileSelect} />
              </div>
              {uploadState === 'error' && (
                <div className="text-[11px] text-red-400">{uploadError}</div>
              )}
            </div>
            {form.cover && (
              <img
                src={form.cover}
                alt=""
                className="w-11 h-15 rounded-md border border-border object-cover shrink-0 bg-background-alt"
                style={{ height: '3.75rem' }}
                onError={e => { e.target.style.visibility = 'hidden'; }}
                onLoad={e => { e.target.style.visibility = 'visible'; }}
              />
            )}
          </div>
        </Field>
        <Field label="標籤（逗號分隔）">
          <input className={inp} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="小說, 奇幻, 漫畫..." />
        </Field>
        <Field label="心得筆記">
          <textarea className={`${inp} h-20 resize-none`} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </Field>

        <div className="h-px bg-border" />

        {conflict && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-[11px] text-amber-400 leading-relaxed">
            此書籍已在其他裝置被更新，為避免覆蓋對方的變更，剛才的儲存已取消。請關閉後重新開啟這本書，確認最新內容再編輯一次。
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            onClick={handleSave}
            disabled={!form.title.trim() || saving}
            className="flex-1 rounded-lg bg-accent py-2.5 text-xs font-semibold text-accent-foreground hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background-alt"
          >
            {saving ? '儲存中...' : isNew ? '新增' : '儲存變更'}
          </button>
          {!isNew && (
            <button
              onClick={() => { onDelete(book.id); onClose(); }}
              className="rounded-lg border border-white/15 px-4 py-2.5 text-xs text-muted-foreground hover:border-red-900/60 hover:text-red-400 active:scale-[0.98] transition-all duration-200"
            >
              刪除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

const inp = 'w-full rounded-lg border border-border bg-background/60 backdrop-blur-sm px-3 py-2 text-xs text-foreground placeholder-muted-foreground/70 outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 focus:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all duration-200';
