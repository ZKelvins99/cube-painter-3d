import { FoldControls } from '@/components/FoldControls'
import { FACE_LABELS } from '@/lib/faceLabels'
import { CubeScene } from '@/scene/CubeScene'
import { useCubeStore } from '@/store/cubeStore'

export function PreviewPanel() {
  const hoveredFace3d = useCubeStore((s) => s.hoveredFace3d)

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">3D 预览区</p>
      <FoldControls />
      <div className="relative mt-4 h-full min-h-[400px] flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
        {hoveredFace3d && (
          <div
            className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-white shadow-sm backdrop-blur-sm"
            title={`${FACE_LABELS[hoveredFace3d]}面`}
          >
            {FACE_LABELS[hoveredFace3d]}面
          </div>
        )}
        <CubeScene />
      </div>
    </div>
  )
}
