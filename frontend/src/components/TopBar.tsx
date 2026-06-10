const ACTIONS = ['示例题', '展开图', '保存', '新建'] as const

export function TopBar() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
      <h1 className="text-lg font-semibold text-slate-800">Cube Painter 3D</h1>
      <div className="flex items-center gap-2">
        {ACTIONS.map((label) => (
          <button
            key={label}
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors hover:border-[#3B82F6] hover:text-[#3B82F6]"
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  )
}
