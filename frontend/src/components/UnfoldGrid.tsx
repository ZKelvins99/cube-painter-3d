import { useMemo } from 'react'
import { FaceThumbnail } from '@/components/FaceThumbnail'
import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'
import { useCubeStore } from '@/store/cubeStore'
import { FACE_LABELS } from '@/lib/faceLabels'

const CELL_PX = 56

export function UnfoldGrid() {
  const unfoldType = useCubeStore((s) => s.unfoldType)
  const activeFace = useCubeStore((s) => s.activeFace)
  const faces = useCubeStore((s) => s.project.faces)
  const setActiveFace = useCubeStore((s) => s.setActiveFace)

  const layout = UNFOLD_LAYOUTS[unfoldType - 1]

  const { cols, rows, minX, minY } = useMemo(() => {
    const xs = layout.cells.map((c) => c.gridX)
    const ys = layout.cells.map((c) => c.gridY)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    return {
      minX,
      minY,
      cols: maxX - minX + 1,
      rows: maxY - minY + 1,
    }
  }, [layout])

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-slate-500">
        展开图 · {layout.name}
      </p>
      <div
        className="inline-grid gap-1 self-center rounded-xl border border-slate-200 bg-slate-100 p-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${CELL_PX}px)`,
          gridTemplateRows: `repeat(${rows}, ${CELL_PX}px)`,
        }}
      >
        {layout.cells.map((cell) => {
          const isActive = cell.faceId === activeFace
          const label = FACE_LABELS[cell.faceId]
          return (
            <button
              key={cell.faceId}
              type="button"
              onClick={() => setActiveFace(cell.faceId)}
              className={[
                'flex aspect-square flex-col items-center justify-center overflow-hidden rounded-lg border-2 bg-white p-0.5 transition-all duration-150 active:scale-[0.97]',
                isActive
                  ? 'border-[#3B82F6] shadow-sm ring-1 ring-[#3B82F6]/30'
                  : 'border-slate-200 hover:border-[#3B82F6]/50 hover:bg-blue-50/50 hover:shadow-sm',
              ].join(' ')}
              style={{
                gridColumn: cell.gridX - minX + 1,
                gridRow: cell.gridY - minY + 1,
              }}
              aria-pressed={isActive}
              aria-label={`${label}面`}
              title={label}
            >
              <FaceThumbnail fabricJson={faces[cell.faceId].fabricJson} label={label} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
