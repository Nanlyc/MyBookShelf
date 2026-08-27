import { useState, useRef } from 'react';
import { parseCSV, buildAutoMapping, applyMapping, mergeBooks, OUR_FIELDS } from '../services/csvImport';
import { batchAppendBooks, replaceAllBooks } from '../services/sheets';

const STEPS = ['上傳', '對應欄位', '預覽', '匯入'];

export default function CsvImportModal({ existingBooks, onDone, onClose }) {
  const [step, setStep] = useState(0);
  const [parsed, setParsed] = useState(null);   // { data, meta }
  const [mapping, setMapping] = useState({});
  const [mode, setMode] = useState('merge');     // 'merge' | 'replace'
  const [status, setStatus] = useState(null);    // null | 'loading' | 'done' | 'error'
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const result = await parseCSV(file);
    setParsed(result);
    setMapping(buildAutoMapping(result.meta.fields));
    setStep(1);
  }

  const mappedBooks = parsed ? applyMapping(parsed.data, mapping) : [];

  async function handleImport() {
    setStatus('loading');
    try {
      if (mode === 'replace') {
        await replaceAllBooks(mappedBooks);
        setResult({ imported: mappedBooks.length, skipped: 0 });
      } else {
        const { newBooks, skipped } = mergeBooks(existingBooks, mappedBooks);
        await batchAppendBooks(newBooks);
        setResult({ imported: newBooks.length, skipped });
      }
      setStatus('done');
    } catch (e) {
      setStatus('error');
      setResult({ error: e.message });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-background-alt/95 backdrop-blur-md p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-foreground">匯入 CSV</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-accent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`flex items-center gap-1.5 text-[11px] ${i === step ? 'text-accent font-medium' : i < step ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold
                  ${i === step ? 'bg-accent text-accent-foreground' : i < step ? 'bg-white/10 text-muted-foreground' : 'bg-white/5 text-muted-foreground/50'}`}>
                  {i + 1}
                </span>
                {s}
              </div>
              {i < STEPS.length - 1 && <span className="text-muted-foreground/30 mx-1">›</span>}
            </div>
          ))}
        </div>

        <div className="h-px bg-border" />

        {/* Step 0: Upload */}
        {step === 0 && (
          <div
            className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/10 rounded-xl py-14 cursor-pointer hover:border-accent/40 hover:bg-white/[0.03] transition-colors duration-200"
            onClick={() => fileRef.current.click()}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="1.5">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
              <path d="M12 12v6M9 15l3-3 3 3"/>
            </svg>
            <div className="text-sm text-muted-foreground">點擊選擇 CSV 檔案</div>
            <div className="text-xs text-muted-foreground/60">Notion 匯出的 CSV 格式皆可</div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>
        )}

        {/* Step 1: Column mapping */}
        {step === 1 && parsed && (
          <div className="flex flex-col gap-4">
            <div className="text-xs text-muted-foreground">共讀取 <span className="font-semibold text-foreground">{parsed.data.length}</span> 筆資料，請確認欄位對應</div>
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {parsed.meta.fields.map(csvCol => (
                <div key={csvCol} className="flex items-center gap-3">
                  <div className="w-40 text-xs truncate text-muted-foreground shrink-0">{csvCol}</div>
                  <span className="text-muted-foreground/50 text-xs">→</span>
                  <select
                    className="flex-1 rounded-lg border border-border bg-background/60 px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                    value={mapping[csvCol] || ''}
                    onChange={e => setMapping(m => ({ ...m, [csvCol]: e.target.value }))}
                  >
                    <option value="">（略過）</option>
                    {OUR_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="self-end rounded-lg bg-accent px-5 py-2 text-xs font-semibold text-accent-foreground hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-[0.98] transition-all duration-200">
              下一步
            </button>
          </div>
        )}

        {/* Step 2: Preview + mode */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="text-xs text-muted-foreground">預覽前 5 筆</div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full text-xs">
                <thead className="bg-white/[0.03]">
                  <tr>
                    {['書名', '作者', '狀態', '來源', '系列'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mappedBooks.slice(0, 5).map((b, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2 max-w-[150px] truncate text-foreground">{b.title || '—'}</td>
                      <td className="px-3 py-2 max-w-[100px] truncate text-muted-foreground">{b.authors || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{b.status || '未讀'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{b.source || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{b.series_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3">
              <div className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">匯入方式</div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="radio" name="mode" value="merge" checked={mode === 'merge'} onChange={() => setMode('merge')} className="mt-0.5 accent-accent" />
                <div>
                  <div className="text-xs font-medium text-foreground">合併</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">書名＋作者相同的略過，只新增沒有的</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="radio" name="mode" value="replace" checked={mode === 'replace'} onChange={() => setMode('replace')} className="mt-0.5 accent-accent" />
                <div>
                  <div className="text-xs font-medium text-red-400">取代</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">清除所有現有資料，完全以此 CSV 取代</div>
                </div>
              </label>
            </div>

            <div className="flex gap-2.5 justify-end">
              <button onClick={() => setStep(1)} className="rounded-lg border border-white/15 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-white/25 active:scale-[0.98] transition-all duration-200">上一步</button>
              <button onClick={() => { setStep(3); handleImport(); }} className="rounded-lg bg-accent px-5 py-2 text-xs font-semibold text-accent-foreground hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-[0.98] transition-all duration-200">
                確認匯入
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && (
          <div className="flex flex-col items-center gap-4 py-10">
            {status === 'loading' && (
              <>
                <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-accent animate-spin" />
                <div className="text-sm text-muted-foreground">匯入中，請稍候...</div>
              </>
            )}
            {status === 'done' && (
              <>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                </div>
                <div className="text-sm font-medium text-foreground">匯入完成</div>
                <div className="text-xs text-muted-foreground">
                  新增 <span className="font-semibold text-foreground">{result.imported}</span> 筆
                  {result.skipped > 0 && <>，略過重複 <span className="font-semibold">{result.skipped}</span> 筆</>}
                </div>
                <button onClick={onDone} className="rounded-lg bg-accent px-6 py-2 text-xs font-semibold text-accent-foreground hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-[0.98] transition-all duration-200">
                  完成
                </button>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold">!</div>
                <div className="text-xs text-red-400">{result?.error}</div>
                <button onClick={() => { setStep(2); setStatus(null); }} className="rounded-lg border border-white/15 px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  返回重試
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
