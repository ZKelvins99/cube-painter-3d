import { Copy, Grid3x3, Magnet, Minus, Plus, Trash2, BringToFront, SendToBack } from 'lucide-react'
import { useCubeStore } from '@/store/cubeStore'
import type { DashStyle } from '@/types/cube'

const COLORS = [
  '#111827', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ffffff', '#6b7280',
]

const DASH_STYLES: { id: DashStyle; label: string }[] = [
  { id: 'solid', label: '实' },
  { id: 'dashed', label: '虚' },
  { id: 'dotted', label: '点' },
]

interface PropertyPanelProps {
  onDuplicate?: () => void
  onDelete?: () => void
  onBringForward?: () => void
  onSendBackward?: () => void
}

export function PropertyPanel({
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
}: PropertyPanelProps) {
  const strokeColor = useCubeStore((s) => s.strokeColor)
  const strokeWidth = useCubeStore((s) => s.strokeWidth)
  const dashStyle = useCubeStore((s) => s.dashStyle)
  const showGrid = useCubeStore((s) => s.showGrid)
  const snapEnabled = useCubeStore((s) => s.snapEnabled)
  const setStrokeColor = useCubeStore((s) => s.setStrokeColor)
  const setStrokeWidth = useCubeStore((s) => s.setStrokeWidth)
  const setDashStyle = useCubeStore((s) => s.setDashStyle)
  const toggleGrid = useCubeStore((s) => s.toggleGrid)
  const toggleSnap = useCubeStore((s) => s.toggleSnap)

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px]">
      {/* 颜色 */}
      <div className="flex items-center gap-1">
        <span className="text-slate-400">色</span>
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setStrokeColor(c)}
            className={`h-4 w-4 rounded-full border transition-transform hover:scale-110 ${
              strokeColor === c ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]' : 'border-slate-300'
            }`}
            style={{ backgroundColor: c }}
            aria-label={`颜色 ${c}`}
          />
        ))}
      </div>

      <span className="h-4 w-px bg-slate-200" />

      {/* 线宽 */}
      <div className="flex items-center gap-0.5">
        <span className="text-slate-400">宽</span>
        <button
          type="button"
          onClick={() => setStrokeWidth(Math.max(1, strokeWidth - 1))}
          className="rounded p-0.5 text-slate-500 hover:bg-slate-200"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-5 text-center font-medium text-slate-600">{strokeWidth}</span>
        <button
          type="button"
          onClick={() => setStrokeWidth(Math.min(20, strokeWidth + 1))}
          className="rounded p-0.5 text-slate-500 hover:bg-slate-200"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <span className="h-4 w-px bg-slate-200" />

      {/* 线型 */}
      <div className="flex items-center gap-0.5">
        <span className="text-slate-400">型</span>
        {DASH_STYLES.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDashStyle(d.id)}
            className={`rounded px-1.5 py-0.5 font-medium transition-colors ${
              dashStyle === d.id
                ? 'bg-[#3B82F6] text-white'
                : 'bg-white text-slate-500 hover:bg-slate-100'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <span className="h-4 w-px bg-slate-200" />

      {/* 辅助开关 */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={toggleGrid}
          className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 font-medium transition-colors ${
            showGrid ? 'bg-[#3B82F6] text-white' : 'bg-white text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Grid3x3 className="h-3 w-3" />
          网格
        </button>
        <button
          type="button"
          onClick={toggleSnap}
          className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 font-medium transition-colors ${
            snapEnabled ? 'bg-[#3B82F6] text-white' : 'bg-white text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Magnet className="h-3 w-3" />
          吸附
        </button>
      </div>

      <span className="h-4 w-px bg-slate-200" />

      {/* 编辑操作 */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onDuplicate}
          className="flex items-center gap-0.5 rounded px-1.5 py-0.5 font-medium text-slate-500 transition-colors hover:bg-slate-200"
        >
          <Copy className="h-3 w-3" />
          复制
        </button>
        <button
          type="button"
          onClick={onBringForward}
          className="rounded p-0.5 text-slate-500 transition-colors hover:bg-slate-200"
          title="上移图层"
        >
          <BringToFront className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onSendBackward}
          className="rounded p-0.5 text-slate-500 transition-colors hover:bg-slate-200"
          title="下移图层"
        >
          <SendToBack className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-0.5 rounded px-1.5 py-0.5 font-medium text-red-500 transition-colors hover:bg-red-50"
        >
          <Trash2 className="h-3 w-3" />
          删除
        </button>
      </div>
    </div>
  )
}
