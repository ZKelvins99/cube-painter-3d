import { useCallback, useEffect, useRef, useState } from 'react'
import type { Canvas } from 'fabric'
import { UnfoldGrid } from '@/components/UnfoldGrid'
import { FabricFaceCanvas, type FabricFaceCanvasHandle } from '@/editor/FabricFaceCanvas'
import type { ShapeKey } from '@/editor/shapes'
import { useFabricHistory, type EditorHistoryApi } from '@/editor/useFabricHistory'
import { useCubeStore } from '@/store/cubeStore'
import { FACE_LABELS } from '@/lib/faceLabels'

interface EditorPanelProps {
  onHistoryReady?: (history: EditorHistoryApi) => void
  onHistoryFlagsChange?: (flags: { canUndo: boolean; canRedo: boolean }) => void
  onRegisterInsertShape?: (insertShape: (key: ShapeKey) => void) => void
}

export function EditorPanel({
  onHistoryReady,
  onHistoryFlagsChange,
  onRegisterInsertShape,
}: EditorPanelProps) {
  const mode = useCubeStore((s) => s.mode)
  const projectId = useCubeStore((s) => s.project.id)
  const activeFace = useCubeStore((s) => s.activeFace)
  const updateFaceJson = useCubeStore((s) => s.updateFaceJson)
  const [canvas, setCanvas] = useState<Canvas | null>(null)
  const canvasHandleRef = useRef<FabricFaceCanvasHandle>(null)
  const historyReadyRef = useRef(false)

  const history = useFabricHistory(canvas, {
    onAfterRestore: () => {
      if (canvas) updateFaceJson(activeFace, canvas.toObject())
    },
    onFlagsChange: onHistoryFlagsChange,
  })

  const historyRef = useRef(history)
  historyRef.current = history

  const handleFaceLoaded = useCallback(() => {
    historyRef.current.reset()
  }, [])

  useEffect(() => {
    if (!canvas || historyReadyRef.current) return
    historyReadyRef.current = true
    onHistoryReady?.(historyRef.current)
  }, [canvas, onHistoryReady])

  useEffect(() => {
    historyReadyRef.current = false
  }, [projectId])

  useEffect(() => {
    onRegisterInsertShape?.((key) => {
      canvasHandleRef.current?.insertShape(key)
    })
  }, [onRegisterInsertShape])

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl bg-white p-4 shadow-sm">
      {mode === 'unfold-edit' && (
        <>
          <UnfoldGrid />
          <p className="mt-4 text-sm font-medium text-slate-700">
            正在编辑：<span className="text-[#3B82F6]">{FACE_LABELS[activeFace]}</span> 面
          </p>
        </>
      )}
      {mode !== 'unfold-edit' && (
        <p className="text-sm font-medium text-slate-500">
          2D 编辑区 · {FACE_LABELS[activeFace]}
        </p>
      )}
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
