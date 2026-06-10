import { SHAPE_LABELS, SHAPES, type ShapeKey } from '@/editor/shapes'

const SHAPE_KEYS = Object.keys(SHAPES) as ShapeKey[]

interface ShapeLibraryPanelProps {
  onInsertShape: (key: ShapeKey) => void
}

export function ShapeLibraryPanel({ onInsertShape }: ShapeLibraryPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-2 text-center text-xs font-medium text-slate-500">图元库</p>
      <div className="grid grid-cols-3 gap-2">
        {SHAPE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onInsertShape(key)}
            className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
          >
            {SHAPE_LABELS[key]}
          </button>
        ))}
      </div>
    </div>
  )
}
