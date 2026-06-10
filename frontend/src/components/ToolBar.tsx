import {
  Eraser,
  Minus,
  MousePointer2,
  Shapes,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'
import { useCubeStore } from '@/store/cubeStore'
import type { EditorTool } from '@/types/cube'

const TOOLS: { id: EditorTool; label: string; icon: LucideIcon }[] = [
  { id: 'select', label: '选择', icon: MousePointer2 },
  { id: 'line', label: '直线', icon: Minus },
  { id: 'polyline', label: '折线', icon: Waypoints },
  { id: 'eraser', label: '橡皮', icon: Eraser },
  { id: 'shape', label: '图元', icon: Shapes },
]

export function ToolBar() {
  const tool = useCubeStore((s) => s.tool)
  const setTool = useCubeStore((s) => s.setTool)

  return (
    <footer className="flex shrink-0 items-center justify-center gap-2 border-t border-slate-200 bg-white px-4 py-3 shadow-sm">
      {TOOLS.map(({ id, label, icon: Icon }) => {
        const active = tool === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTool(id)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-colors ${
              active
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        )
      })}
    </footer>
  )
}
