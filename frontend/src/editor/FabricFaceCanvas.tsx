import { useEffect, useRef, type MutableRefObject } from 'react'
import { Canvas } from 'fabric'
import { attachEraserTool } from '@/editor/tools/eraserTool'
import { attachLineTool } from '@/editor/tools/lineTool'
import { attachPolylineTool } from '@/editor/tools/polylineTool'
import { FACE_SIZE } from '@/lib/faceCanvas'
import { useCubeStore } from '@/store/cubeStore'
import type { EditorTool, FaceId } from '@/types/cube'

function applyToolMode(canvas: Canvas, tool: EditorTool) {
  const isDrawTool = tool === 'line' || tool === 'polyline'
  canvas.selection = tool === 'select'
  canvas.skipTargetFind = isDrawTool
  canvas.defaultCursor = isDrawTool ? 'crosshair' : tool === 'eraser' ? 'pointer' : 'default'
  canvas.hoverCursor =
    tool === 'select' ? 'move' : tool === 'eraser' ? 'pointer' : isDrawTool ? 'crosshair' : 'default'
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

  const activeFace = useCubeStore((s) => s.activeFace)
  const tool = useCubeStore((s) => s.tool)
  const updateFaceJson = useCubeStore((s) => s.updateFaceJson)

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

    const canvas = new Canvas(el, {
      width: FACE_SIZE,
      height: FACE_SIZE,
      backgroundColor: '#ffffff',
    })
    fabricRef.current = canvas
    onCanvasReady?.(canvas)

    const { activeFace: initialFace, tool: initialTool, project } =
      useCubeStore.getState()
    activeFaceRef.current = initialFace
    applyToolMode(canvas, initialTool)

    const persist = () => {
      if (isLoadingRef.current || isRestoringRef?.current) return
      updateFaceJson(activeFaceRef.current, canvas.toObject())
    }

    canvas.on('object:added', persist)
    canvas.on('object:modified', persist)
    canvas.on('object:removed', persist)

    isLoadingRef.current = true
    void canvas.loadFromJSON(project.faces[initialFace].fabricJson).then(() => {
      isLoadingRef.current = false
      canvas.requestRenderAll()
      onFaceLoaded?.()
    })

    return () => {
      updateFaceJson(activeFaceRef.current, canvas.toObject())
      canvas.dispose()
      fabricRef.current = null
    }
  }, [updateFaceJson, onCanvasReady, onFaceLoaded, isRestoringRef])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const prevFace = activeFaceRef.current
    if (prevFace === activeFace) return

    updateFaceJson(prevFace, canvas.toObject())
    activeFaceRef.current = activeFace

    isLoadingRef.current = true
    const json = useCubeStore.getState().project.faces[activeFace].fabricJson
    void canvas.loadFromJSON(json).then(() => {
      isLoadingRef.current = false
      canvas.requestRenderAll()
      onFaceLoaded?.()
    })
  }, [activeFace, updateFaceJson, onFaceLoaded])

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
