import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'
import { useCubeStore } from '@/store/cubeStore'
import type { AppMode, UnfoldType } from '@/types/cube'

const ACTIONS = ['示例题', '保存', '新建'] as const

const MODES: { id: AppMode; label: string }[] = [
  { id: 'unfold-edit', label: '展开编辑' },
  { id: '3d-view', label: '3D观察' },
  { id: 'step-fold', label: '分步折叠' },
]

export function TopBar() {
  const mode = useCubeStore((s) => s.mode)
  const unfoldType = useCubeStore((s) => s.unfoldType)
  const setMode = useCubeStore((s) => s.setMode)
  const setUnfoldType = useCubeStore((s) => s.setUnfoldType)

  return (
    <header className="flex shrink-0 flex-col gap-2 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">Cube Painter 3D</h1>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="sr-only">展开图类型</span>
            <span aria-hidden>展开图</span>
            <select
              value={unfoldType}
              onChange={(e) => setUnfoldType(Number(e.target.value) as UnfoldType)}
              className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 transition-colors hover:border-[#3B82F6] focus:border-[#3B82F6] focus:outline-none"
            >
              {UNFOLD_LAYOUTS.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.id}. {layout.name}
                </option>
              ))}
            </select>
          </label>
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
      </div>
      <div className="flex justify-center">
        <div
          className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5"
          role="tablist"
          aria-label="编辑模式"
        >
          {MODES.map(({ id, label }) => {
            const isActive = mode === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setMode(id)}
                className={[
                  'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white text-[#3B82F6] shadow-sm'
                    : 'text-slate-600 hover:text-slate-800',
                ].join(' ')}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
