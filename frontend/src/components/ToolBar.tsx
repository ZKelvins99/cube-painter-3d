import {
  ArrowRight,
  Circle as CircleIcon,
  Eraser,
  Minus,
  MousePointer2,
  Pencil,
  Redo2,
  Shapes,
  Square,
  Undo2,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'
import { ShapeLibraryPanel } from '@/components/ShapeLibraryPanel'
import type { ShapeKey } from '@/editor/shapes'
import type { EditorHistoryApi } from '@/editor/useFabricHistory'
import { useCubeStore } from '@/store/cubeStore'
import type { EditorTool } from '@/types/cube'

const TOOLS: { id: EditorTool; label: string; icon: LucideIcon }[] = [
  { id: 'select', label: '选择', icon: MousePointer2 },
  { id: 'line', label: '直线', icon: Minus },
  { id: 'polyline', label: '折线', icon: Waypoints },
  { id: 'rectangle', label: '矩形', icon: Square },
  { id: 'circle', label: '圆形', icon: CircleIcon },
  { id: 'arrow', label: '箭头', icon: ArrowRight },
  { id: 'freehand', label: '画笔', icon: Pencil },
  { id: 'eraser', label: '橡皮', icon: Eraser },
  { id: 'shape', label: '图元', icon: Shapes },
]

interface ToolBarProps {
  history?: EditorHistoryApi | null
  canUndo?: boolean
  canRedo?: boolean
  onInsertShape: (key: ShapeKey) => void
}

export function ToolBar({ history, canUndo = false, canRedo = false, onInsertShape }: ToolBarProps) {
  const tool = useCubeStore((s) => s.tool)
  const setTool = useCubeStore((s) => s.setTool)

  return (
    <div className="relative shrink-0">
      {tool === 'shape' && (
        <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2">
          <ShapeLibraryPanel onInsertShape={onInsertShape} />
        </div>
      )}
      <footer className="flex flex-wrap items-center justify-center gap-1 border-t border-slate-200 bg-white px-3 py-2 shadow-sm">
        {TOOLS.map(({ id, label, icon: Icon }) => {
          const active = tool === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTool(id)}
              className={`btn-tool ${active ? 'btn-tool-active' : 'btn-tool-inactive'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
        <span className="mx-1 h-6 w-px bg-slate-200" aria-hidden />
        <button
          type="button"
          disabled={!canUndo}
          onClick={() => history?.undo()}
          className="btn-tool enabled:btn-tool-inactive disabled:cursor-not-allowed disabled:text-slate-300"
        >
          <Undo2 className="h-4 w-4" />
          撤销
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={() => history?.redo()}
          className="btn-tool enabled:btn-tool-inactive disabled:cursor-not-allowed disabled:text-slate-300"
        >
          <Redo2 className="h-4 w-4" />
          重做
        </button>
      </footer>
    </div>
  )
}
