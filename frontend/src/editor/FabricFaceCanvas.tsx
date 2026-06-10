import { forwardRef, useEffect, useImperativeHandle, useRef, type MutableRefObject } from 'react'
import { Canvas } from 'fabric'
import { SHAPES, type ShapeKey } from '@/editor/shapes'
import { attachEraserTool } from '@/editor/tools/eraserTool'
import { attachLineTool } from '@/editor/tools/lineTool'
import { attachPolylineTool } from '@/editor/tools/polylineTool'
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
  const isDrawTool = tool === 'line' || tool === 'polyline'
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
}

export interface FabricFaceCanvasProps {
  onCanvasReady?: (canvas: Canvas) => void
  onFaceLoaded?: () => void
  isRestoringRef?: MutableRefObject<boolean>
}

export const FabricFaceCanvas = forwardRef<FabricFaceCanvasHandle, FabricFaceCanvasProps>(
  function FabricFaceCanvas({ onCanvasReady, onFaceLoaded, isRestoringRef }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<Canvas | null>(null)
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
    }),
    [],
  )

  useEffect(() => {
    const el = canvasRef.current
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

    return () => {
      disposed = true
      canvas.off('object:added', persist)
      canvas.off('object:modified', persist)
      canvas.off('object:removed', persist)
      canvas.dispose()
      fabricRef.current = null
    }
  }, [])

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

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    applyToolMode(canvas, tool)

    if (tool === 'line') return attachLineTool(canvas)
    if (tool === 'polyline') return attachPolylineTool(canvas)
    if (tool === 'eraser') return attachEraserTool(canvas)
  }, [tool])

  return (
    <canvas
      ref={canvasRef}
      width={FACE_SIZE}
      height={FACE_SIZE}
      className="block max-w-full border border-slate-200"
    />
  )
},
)
