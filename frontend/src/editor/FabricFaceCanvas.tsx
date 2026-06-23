import { forwardRef, useEffect, useImperativeHandle, useRef, type MutableRefObject } from 'react'
import { Canvas } from 'fabric'
import { SHAPES, type ShapeKey } from '@/editor/shapes'
import { createToolApi, drawGrid, type ToolApi } from '@/editor/snapping'
import { attachEraserTool } from '@/editor/tools/eraserTool'
import { attachLineTool } from '@/editor/tools/lineTool'
import { attachPolylineTool } from '@/editor/tools/polylineTool'
import { attachRectangleTool } from '@/editor/tools/rectangleTool'
import { attachCircleTool } from '@/editor/tools/circleTool'
import { attachArrowTool } from '@/editor/tools/arrowTool'
import { attachFreehandTool } from '@/editor/tools/freehandTool'
import { emptyFabricJson } from '@/lib/emptyFaceJson'
import { FACE_SIZE } from '@/lib/faceCanvas'
import { useCubeStore } from '@/store/cubeStore'
import type { EditorTool, FaceId } from '@/types/cube'

async function loadFaceJson(
  canvas: Canvas,
  json: object,
  faceId: FaceId,
  isAlive: () => boolean,
  onLoaded?: () => void,
) {
  if (!isAlive()) return
  try {
    await canvas.loadFromJSON(json)
  } catch (err) {
    if (!isAlive()) return
    console.error(`[FabricFaceCanvas] loadFromJSON failed for face "${faceId}":`, err)
    try {
      await canvas.loadFromJSON(emptyFabricJson())
    } catch (err2) {
      console.error('[FabricFaceCanvas] fallback empty load also failed:', err2)
    }
  }
  if (!isAlive()) return
  canvas.requestRenderAll()
  onLoaded?.()
}

function applyToolMode(canvas: Canvas, tool: EditorTool) {
  const isDrawTool =
    tool === 'line' ||
    tool === 'polyline' ||
    tool === 'rectangle' ||
    tool === 'circle' ||
    tool === 'arrow' ||
    tool === 'freehand'
  canvas.selection = tool === 'select' || tool === 'shape'
  canvas.skipTargetFind = isDrawTool
  canvas.defaultCursor = isDrawTool ? 'crosshair' : tool === 'eraser' ? 'pointer' : 'default'
  canvas.hoverCursor =
    tool === 'select' || tool === 'shape'
      ? 'move'
      : tool === 'eraser'
        ? 'pointer'
        : isDrawTool
          ? 'crosshair'
          : 'default'
}

function jsonEqual(a: object, b: object): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export type FabricFaceCanvasHandle = {
  insertShape: (key: ShapeKey) => void
  duplicateSelected: () => void
  deleteSelected: () => void
  bringForward: () => void
  sendBackward: () => void
}

export interface FabricFaceCanvasProps {
  onCanvasReady?: (canvas: Canvas) => void
  onFaceLoaded?: () => void
  isRestoringRef?: MutableRefObject<boolean>
}

export const FabricFaceCanvas = forwardRef<FabricFaceCanvasHandle, FabricFaceCanvasProps>(
  function FabricFaceCanvas({ onCanvasReady, onFaceLoaded, isRestoringRef }, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<Canvas | null>(null)
  const toolApiRef = useRef<ToolApi | null>(null)
  const isLoadingRef = useRef(false)
  const activeFaceRef = useRef<FaceId>('front')
  const onCanvasReadyRef = useRef(onCanvasReady)
  const onFaceLoadedRef = useRef(onFaceLoaded)
  const isRestoringRefStable = isRestoringRef

  onCanvasReadyRef.current = onCanvasReady
  onFaceLoadedRef.current = onFaceLoaded

  const activeFace = useCubeStore((s) => s.activeFace)
  const tool = useCubeStore((s) => s.tool)
  const projectId = useCubeStore((s) => s.project.id)
  const showGrid = useCubeStore((s) => s.showGrid)

  useImperativeHandle(
    ref,
    () => ({
      insertShape(key: ShapeKey) {
        const canvas = fabricRef.current
        if (!canvas) return
        const shape = SHAPES[key]()
        canvas.add(shape)
        canvas.setActiveObject(shape)
        canvas.requestRenderAll()
      },
      duplicateSelected() {
        const canvas = fabricRef.current
        if (!canvas) return
        const active = canvas.getActiveObject()
        if (!active) return
        active.clone().then((cloned: any) => {
          cloned.set({ left: (active.left ?? 0) + 16, top: (active.top ?? 0) + 16 })
          canvas.add(cloned)
          canvas.setActiveObject(cloned)
          canvas.requestRenderAll()
        })
      },
      deleteSelected() {
        const canvas = fabricRef.current
        if (!canvas) return
        const active = canvas.getActiveObject()
        if (!active) return
        canvas.remove(active)
        canvas.discardActiveObject()
        canvas.requestRenderAll()
      },
      bringForward() {
        const canvas = fabricRef.current
        if (!canvas) return
        const active = canvas.getActiveObject()
        if (!active) return
        canvas.bringObjectForward(active)
        canvas.requestRenderAll()
      },
      sendBackward() {
        const canvas = fabricRef.current
        if (!canvas) return
        const active = canvas.getActiveObject()
        if (!active) return
        canvas.sendObjectBackwards(active)
        canvas.requestRenderAll()
      },
    }),
    [],
  )

  // 初始化画布 + ResizeObserver
  useEffect(() => {
    const el = canvasRef.current
    const overlayEl = overlayRef.current
    const containerEl = containerRef.current
    if (!el) return

    let canvas: Canvas
    try {
      canvas = new Canvas(el, {
        width: FACE_SIZE,
        height: FACE_SIZE,
        backgroundColor: '#ffffff',
      })
    } catch (err) {
      console.error('[FabricFaceCanvas] Canvas creation failed:', err)
      return
    }
    fabricRef.current = canvas

    // 覆盖层 + 工具 API
    const overlayCtx = overlayEl?.getContext('2d') ?? null
    const toolApi = createToolApi(canvas, overlayCtx)
    toolApiRef.current = toolApi

    if (overlayCtx && useCubeStore.getState().showGrid) {
      drawGrid(overlayCtx)
    }

    onCanvasReadyRef.current?.(canvas)

    const { activeFace: initialFace, tool: initialTool, project } =
      useCubeStore.getState()
    activeFaceRef.current = initialFace
    applyToolMode(canvas, initialTool)

    const persist = () => {
      if (isLoadingRef.current || isRestoringRefStable?.current) return
      const faceId = activeFaceRef.current
      const faceData = useCubeStore.getState().project.faces[faceId]
      if (!faceData) return
      const json = canvas.toObject()
      if (jsonEqual(faceData.fabricJson, json)) return
      useCubeStore.getState().updateFaceJson(faceId, json)
    }

    canvas.on('object:added', persist)
    canvas.on('object:modified', persist)
    canvas.on('object:removed', persist)

    const initialFaceJson = project.faces[initialFace]?.fabricJson ?? emptyFabricJson()

    let disposed = false
    isLoadingRef.current = true
    void loadFaceJson(
      canvas,
      initialFaceJson,
      initialFace,
      () => !disposed,
      () => {
        if (!disposed) onFaceLoadedRef.current?.()
      },
    ).catch((err) => {
      if (!disposed) console.error('[FabricFaceCanvas] initial face load failed:', err)
    }).finally(() => {
      if (!disposed) {
        requestAnimationFrame(() => {
          isLoadingRef.current = false
        })
      }
    })

    // ---- 自适应尺寸：ResizeObserver ----
    const resize = () => {
      if (!containerEl) return
      const rect = containerEl.getBoundingClientRect()
      const size = Math.min(rect.width, rect.height)
      if (size < 50) return
      // 仅改 CSS 尺寸，内部分辨率保持 512×512
      canvas.setDimensions({ width: size, height: size }, { cssOnly: true })
      if (overlayEl) {
        overlayEl.style.width = `${size}px`
        overlayEl.style.height = `${size}px`
      }
    }
    const ro = new ResizeObserver(resize)
    if (containerEl) {
      ro.observe(containerEl)
      resize()
    }

    return () => {
      disposed = true
      ro.disconnect()
      canvas.off('object:added', persist)
      canvas.off('object:modified', persist)
      canvas.off('object:removed', persist)
      canvas.dispose()
      fabricRef.current = null
      toolApiRef.current = null
    }
  }, [])

  // 切换面
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const prevFace = activeFaceRef.current
    if (prevFace === activeFace) return

    if (!isLoadingRef.current) {
      const json = canvas.toObject()
      const prevFaceData = useCubeStore.getState().project.faces[prevFace]
      if (prevFaceData && !jsonEqual(prevFaceData.fabricJson, json)) {
        useCubeStore.getState().updateFaceJson(prevFace, json)
      }
    }
    activeFaceRef.current = activeFace

    isLoadingRef.current = true
    const faceJson = useCubeStore.getState().project.faces[activeFace]?.fabricJson ?? emptyFabricJson()
    let disposed = false
    void loadFaceJson(
      canvas,
      faceJson,
      activeFace,
      () => !disposed,
      () => {
        if (!disposed) onFaceLoadedRef.current?.()
      },
    ).catch((err) => {
      if (!disposed) console.error(`[FabricFaceCanvas] face switch to "${activeFace}" failed:`, err)
    }).finally(() => {
      if (!disposed) {
        requestAnimationFrame(() => {
          isLoadingRef.current = false
        })
      }
    })
    return () => { disposed = true }
  }, [activeFace])

  // 切换项目
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const { activeFace: face } = useCubeStore.getState()
    activeFaceRef.current = face
    isLoadingRef.current = true
    const faceJson = useCubeStore.getState().project.faces[face]?.fabricJson ?? emptyFabricJson()
    let disposed = false
    void loadFaceJson(
      canvas,
      faceJson,
      face,
      () => !disposed,
      () => {
        if (!disposed) onFaceLoadedRef.current?.()
      },
    ).finally(() => {
      if (!disposed) {
        requestAnimationFrame(() => {
          isLoadingRef.current = false
        })
      }
    })
    return () => { disposed = true }
  }, [projectId])

  // 切换工具
  useEffect(() => {
    const canvas = fabricRef.current
    const api = toolApiRef.current
    if (!canvas || !api) return

    applyToolMode(canvas, tool)

    if (tool === 'line') return attachLineTool(api)
    if (tool === 'polyline') return attachPolylineTool(api)
    if (tool === 'rectangle') return attachRectangleTool(api)
    if (tool === 'circle') return attachCircleTool(api)
    if (tool === 'arrow') return attachArrowTool(api)
    if (tool === 'freehand') return attachFreehandTool(api)
    if (tool === 'eraser') return attachEraserTool(api)
  }, [tool])

  // 网格显示切换
  useEffect(() => {
    const overlayEl = overlayRef.current
    if (!overlayEl) return
    const ctx = overlayEl.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, FACE_SIZE, FACE_SIZE)
    if (showGrid) drawGrid(ctx)
  }, [showGrid])

  return (
    <div ref={containerRef} className="relative flex h-full w-full items-center justify-center">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={FACE_SIZE}
          height={FACE_SIZE}
          className="block border border-slate-200"
        />
        <canvas
          ref={overlayRef}
          width={FACE_SIZE}
          height={FACE_SIZE}
          className="pointer-events-none absolute left-0 top-0"
        />
      </div>
    </div>
  )
},
)
