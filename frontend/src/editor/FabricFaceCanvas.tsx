import { useEffect, useRef } from 'react'
import { Canvas } from 'fabric'
import { attachLineTool } from '@/editor/tools/lineTool'
import { FACE_SIZE } from '@/lib/faceCanvas'
import { useCubeStore } from '@/store/cubeStore'
import type { EditorTool, FaceId } from '@/types/cube'

function applyToolMode(canvas: Canvas, tool: EditorTool) {
  canvas.selection = tool === 'select'
  canvas.skipTargetFind = tool === 'line'
  canvas.defaultCursor = tool === 'line' ? 'crosshair' : 'default'
  canvas.hoverCursor = tool === 'select' ? 'move' : 'default'
}

export function FabricFaceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<Canvas | null>(null)
  const isLoadingRef = useRef(false)
  const activeFaceRef = useRef<FaceId>('front')

  const activeFace = useCubeStore((s) => s.activeFace)
  const tool = useCubeStore((s) => s.tool)
  const updateFaceJson = useCubeStore((s) => s.updateFaceJson)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    const canvas = new Canvas(el, {
      width: FACE_SIZE,
      height: FACE_SIZE,
      backgroundColor: '#ffffff',
    })
    fabricRef.current = canvas

    const { activeFace: initialFace, tool: initialTool, project } =
      useCubeStore.getState()
    activeFaceRef.current = initialFace
    applyToolMode(canvas, initialTool)

    const persist = () => {
      if (isLoadingRef.current) return
      updateFaceJson(activeFaceRef.current, canvas.toObject())
    }

    canvas.on('object:added', persist)
    canvas.on('object:modified', persist)
    canvas.on('object:removed', persist)

    isLoadingRef.current = true
    void canvas.loadFromJSON(project.faces[initialFace].fabricJson).then(() => {
      isLoadingRef.current = false
      canvas.requestRenderAll()
    })

    return () => {
      updateFaceJson(activeFaceRef.current, canvas.toObject())
      canvas.dispose()
      fabricRef.current = null
    }
  }, [updateFaceJson])

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
    })
  }, [activeFace, updateFaceJson])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    applyToolMode(canvas, tool)

    if (tool !== 'line') return

    return attachLineTool(canvas)
  }, [tool])

  return (
    <canvas
      ref={canvasRef}
      width={FACE_SIZE}
      height={FACE_SIZE}
      className="block max-w-full border border-slate-200"
    />
  )
}
