import { useCallback, useEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import type { Canvas } from 'fabric'
import { PropertyPanel } from '@/components/PropertyPanel'
import { UnfoldGrid } from '@/components/UnfoldGrid'
import { FabricFaceCanvas, type FabricFaceCanvasHandle } from '@/editor/FabricFaceCanvas'
import type { ShapeKey } from '@/editor/shapes'
import { useFabricHistory, type EditorHistoryApi } from '@/editor/useFabricHistory'
import { useCubeStore } from '@/store/cubeStore'
import { FACE_LABELS } from '@/lib/faceLabels'
import type { EditorTool } from '@/types/cube'

const TOOL_HINTS: Record<EditorTool, string> = {
  select: '点击选择对象 · 拖拽移动位置',
  line: '点击起点 → 点击终点绘制直线 · Shift 约束 45°',
  polyline: '逐次点击添加顶点 · 双击或 Enter 完成 · Esc 取消',
  rectangle: '拖拽绘制矩形 · Shift 约束为正方形',
  circle: '拖拽绘制圆形 · Shift 从中心向外扩展',
  arrow: '拖拽绘制带箭头的线 · Shift 约束 45°',
  freehand: '按住鼠标拖拽自由绘制',
  eraser: '点击对象即可删除',
  shape: '从弹出的图元库中选择形状插入',
}

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
  const tool = useCubeStore((s) => s.tool)
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
    <div className="flex h-full min-h-0 flex-col rounded-2xl bg-white p-3 shadow-sm">
      {mode === 'unfold-edit' && (
        <>
          <UnfoldGrid />
          <p className="mt-2 text-sm font-medium text-slate-700">
            正在编辑：<span className="text-[#3B82F6]">{FACE_LABELS[activeFace]}</span> 面
          </p>
        </>
      )}
      {mode !== 'unfold-edit' && (
        <p className="text-sm font-medium text-slate-500">
          2D 编辑区 · {FACE_LABELS[activeFace]}
        </p>
      )}

      {/* 工具操作提示 */}
      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
        <Info className="h-3 w-3 shrink-0" />
        <span>{TOOL_HINTS[tool]}</span>
      </div>

      {/* 画布区域 — 自适应填充，不滚动 */}
      <div className="mt-2 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
        <FabricFaceCanvas
          ref={canvasHandleRef}
          onCanvasReady={setCanvas}
          onFaceLoaded={handleFaceLoaded}
          isRestoringRef={history.isRestoringRef}
        />
      </div>

      <PropertyPanel
        onDuplicate={() => canvasHandleRef.current?.duplicateSelected()}
        onDelete={() => canvasHandleRef.current?.deleteSelected()}
        onBringForward={() => canvasHandleRef.current?.bringForward()}
        onSendBackward={() => canvasHandleRef.current?.sendBackward()}
      />
    </div>
  )
}
