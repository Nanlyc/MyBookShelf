export const STATUS_STYLE = {
  '未讀':   'bg-white/5 text-muted-foreground',
  '閱讀中': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  '已讀':   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
};

export const STATUS_CYCLE = { '未讀': '閱讀中', '閱讀中': '已讀', '已讀': '未讀' };

export function Stars({ rating, size = 9 }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= rating ? '#F59E0B' : 'none'}
          stroke={i <= rating ? '#F59E0B' : '#3f3f46'}
          strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

export function StatusPill({ status, onCycle }) {
  return (
    <button
      className={`self-start rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight transition-colors ${STATUS_STYLE[status]}`}
      onClick={e => { e.stopPropagation(); onCycle(STATUS_CYCLE[status]); }}
    >
      {status}
    </button>
  );
}
