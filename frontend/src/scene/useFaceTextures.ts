import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createFaceCanvas, FACE_SIZE } from '@/lib/faceCanvas'
import { renderFabricJsonToCanvas } from '@/lib/renderFabricToCanvas'
import { useCubeStore } from '@/store/cubeStore'
import { FACE_IDS, type FaceId } from '@/types/cube'

const DEBOUNCE_MS = 16

export function useFaceTextures(): Record<FaceId, THREE.CanvasTexture> {
  const faces = useCubeStore((s) => s.project.faces)
  const projectId = useCubeStore((s) => s.project.id)
  const bumpFaceTextures = useCubeStore((s) => s.bumpFaceTextures)

  const canvasesRef = useRef<Record<FaceId, HTMLCanvasElement>>(
    {} as Record<FaceId, HTMLCanvasElement>,
  )
  const texturesRef = useRef<Record<FaceId, THREE.CanvasTexture>>(
    {} as Record<FaceId, THREE.CanvasTexture>,
  )
  const timeoutsRef = useRef<Partial<Record<FaceId, ReturnType<typeof setTimeout>>>>({})
  const prevJsonRef = useRef<Partial<Record<FaceId, string>>>({})
  const renderQueueRef = useRef(Promise.resolve())
  const immediateRenderRef = useRef(true)

  const textures = useMemo(() => {
    const nextCanvases = {} as Record<FaceId, HTMLCanvasElement>
    const nextTextures = {} as Record<FaceId, THREE.CanvasTexture>

    for (const faceId of FACE_IDS) {
      const canvas = createFaceCanvas()
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.flipY = false
      texture.needsUpdate = true
      nextCanvases[faceId] = canvas
      nextTextures[faceId] = texture
    }

    canvasesRef.current = nextCanvases
    texturesRef.current = nextTextures
    return nextTextures
  }, [])

  useEffect(() => {
    prevJsonRef.current = {}
    immediateRenderRef.current = true
  }, [projectId])

  useEffect(() => {
    const delay = immediateRenderRef.current ? 0 : DEBOUNCE_MS
    immediateRenderRef.current = false

    for (const faceId of FACE_IDS) {
      const jsonStr = JSON.stringify(faces[faceId].fabricJson)
      if (prevJsonRef.current[faceId] === jsonStr) continue
      prevJsonRef.current[faceId] = jsonStr

      clearTimeout(timeoutsRef.current[faceId])
      timeoutsRef.current[faceId] = setTimeout(() => {
        const json = faces[faceId].fabricJson
        renderQueueRef.current = renderQueueRef.current.then(async () => {
          try {
            const offscreen = canvasesRef.current[faceId]
            await renderFabricJsonToCanvas(json, offscreen, FACE_SIZE)
            texturesRef.current[faceId].needsUpdate = true
            bumpFaceTextures()
          } catch (err) {
            console.error(`[useFaceTextures] render failed for face "${faceId}":`, err)
          }
        })
      }, delay)
    }

    return () => {
      for (const faceId of FACE_IDS) {
        clearTimeout(timeoutsRef.current[faceId])
      }
    }
  }, [faces, bumpFaceTextures])

  useEffect(() => {
    return () => {
      for (const faceId of FACE_IDS) {
        texturesRef.current[faceId]?.dispose()
      }
    }
  }, [])

  return textures
}
