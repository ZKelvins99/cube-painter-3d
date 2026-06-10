import { FabricFaceCanvas } from '@/editor/FabricFaceCanvas'
import { useCubeStore } from '@/store/cubeStore'
import type { FaceId } from '@/types/cube'

const FACE_LABELS: Record<FaceId, string> = {
  front: '前',
  back: '后',
  left: '左',
  right: '右',
  top: '上',
  bottom: '下',
}

export function EditorPanel() {
  const activeFace = useCubeStore((s) => s.activeFace)

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        2D 编辑区 · {FACE_LABELS[activeFace]}
      </p>
      <div className="mt-4 flex flex-1 items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="w-[512px] max-w-full">
          <FabricFaceCanvas />
        </div>
      </div>
    </div>
  )
}
