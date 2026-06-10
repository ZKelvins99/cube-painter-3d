import { useCallback, useEffect, useRef, useState } from 'react'
import type { Canvas } from 'fabric'
import { FabricFaceCanvas, type FabricFaceCanvasHandle } from '@/editor/FabricFaceCanvas'
import type { ShapeKey } from '@/editor/shapes'
import { useFabricHistory, type EditorHistoryApi } from '@/editor/useFabricHistory'
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

interface EditorPanelProps {
  onHistoryReady?: (history: EditorHistoryApi) => void
  onRegisterInsertShape?: (insertShape: (key: ShapeKey) => void) => void
}

export function EditorPanel({ onHistoryReady, onRegisterInsertShape }: EditorPanelProps) {
  const activeFace = useCubeStore((s) => s.activeFace)
  const updateFaceJson = useCubeStore((s) => s.updateFaceJson)
  const [canvas, setCanvas] = useState<Canvas | null>(null)
  const canvasHandleRef = useRef<FabricFaceCanvasHandle>(null)

  const history = useFabricHistory(canvas, {
    onAfterRestore: () => {
      if (canvas) updateFaceJson(activeFace, canvas.toObject())
    },
  })

  const handleFaceLoaded = useCallback(() => {
    history.reset()
  }, [history])

  useEffect(() => {
    onHistoryReady?.(history)
  }, [history, onHistoryReady, history.canUndo, history.canRedo])

  useEffect(() => {
    onRegisterInsertShape?.((key) => {
      canvasHandleRef.current?.insertShape(key)
    })
  }, [onRegisterInsertShape])

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        2D 编辑区 · {FACE_LABELS[activeFace]}
      </p>
      <div className="mt-4 flex flex-1 items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="w-[512px] max-w-full">
          <FabricFaceCanvas
            ref={canvasHandleRef}
            onCanvasReady={setCanvas}
            onFaceLoaded={handleFaceLoaded}
            isRestoringRef={history.isRestoringRef}
          />
        </div>
      </div>
    </div>
  )
}
