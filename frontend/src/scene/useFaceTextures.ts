import { StaticCanvas } from 'fabric'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createFaceCanvas, FACE_SIZE } from '@/lib/faceCanvas'
import { useCubeStore } from '@/store/cubeStore'
import { FACE_IDS, type FaceId } from '@/types/cube'

const DEBOUNCE_MS = 16

export function useFaceTextures(): Record<FaceId, THREE.CanvasTexture> {
  const faces = useCubeStore((s) => s.project.faces)
  const projectId = useCubeStore((s) => s.project.id)

  const canvasesRef = useRef<Record<FaceId, HTMLCanvasElement>>(
    {} as Record<FaceId, HTMLCanvasElement>,
  )
  const texturesRef = useRef<Record<FaceId, THREE.CanvasTexture>>(
    {} as Record<FaceId, THREE.CanvasTexture>,
  )
  const fabricCanvasRef = useRef<StaticCanvas | null>(null)
  const timeoutsRef = useRef<Partial<Record<FaceId, ReturnType<typeof setTimeout>>>>({})
  const prevJsonRef = useRef<Partial<Record<FaceId, string>>>({})
  const renderQueueRef = useRef(Promise.resolve())

  const textures = useMemo(() => {
    const nextCanvases = {} as Record<FaceId, HTMLCanvasElement>
    const nextTextures = {} as Record<FaceId, THREE.CanvasTexture>

    for (const faceId of FACE_IDS) {
      const canvas = createFaceCanvas()
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, FACE_SIZE, FACE_SIZE)
      }
      nextCanvases[faceId] = canvas
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
      nextTextures[faceId] = texture
    }

    canvasesRef.current = nextCanvases
    texturesRef.current = nextTextures
    return nextTextures
  }, [])

  useEffect(() => {
    prevJsonRef.current = {}
  }, [projectId])

  useEffect(() => {
    if (!fabricCanvasRef.current) {
      const el = document.createElement('canvas')
      fabricCanvasRef.current = new StaticCanvas(el, {
        width: FACE_SIZE,
        height: FACE_SIZE,
        backgroundColor: '#ffffff',
      })
    }

    const fabricCanvas = fabricCanvasRef.current

    for (const faceId of FACE_IDS) {
      const jsonStr = JSON.stringify(faces[faceId].fabricJson)
      if (prevJsonRef.current[faceId] === jsonStr) continue
      prevJsonRef.current[faceId] = jsonStr

      clearTimeout(timeoutsRef.current[faceId])
      timeoutsRef.current[faceId] = setTimeout(() => {
        const json = faces[faceId].fabricJson
        renderQueueRef.current = renderQueueRef.current.then(async () => {
          try {
            await fabricCanvas.loadFromJSON(json)
            fabricCanvas.requestRenderAll()

            const offscreen = canvasesRef.current[faceId]
            const ctx = offscreen.getContext('2d')
            if (!ctx) return

            ctx.clearRect(0, 0, FACE_SIZE, FACE_SIZE)
            ctx.drawImage(fabricCanvas.getElement(), 0, 0, FACE_SIZE, FACE_SIZE)
            texturesRef.current[faceId].needsUpdate = true
          } catch (err) {
            console.error(`[useFaceTextures] render failed for face "${faceId}":`, err)
          }
        })
      }, DEBOUNCE_MS)
    }

    return () => {
      for (const faceId of FACE_IDS) {
        clearTimeout(timeoutsRef.current[faceId])
      }
    }
  }, [faces])

  useEffect(() => {
    return () => {
      fabricCanvasRef.current?.dispose()
      fabricCanvasRef.current = null
      for (const faceId of FACE_IDS) {
        texturesRef.current[faceId]?.dispose()
      }
    }
  }, [])

  return textures
}
