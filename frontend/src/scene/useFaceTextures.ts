import { useEffect, useRef, useState } from 'react'
import { createFaceCanvas } from '@/lib/faceCanvas'
import { faceJsonFingerprint, renderFabricJsonToCanvas } from '@/lib/renderFabricToCanvas'
import { useCubeStore } from '@/store/cubeStore'
import { FACE_IDS, type FaceId } from '@/types/cube'

function createInitialCanvases(): Record<FaceId, HTMLCanvasElement> {
  const canvases = {} as Record<FaceId, HTMLCanvasElement>
  for (const faceId of FACE_IDS) {
    canvases[faceId] = createFaceCanvas()
  }
  return canvases
}

export function useFaceTextures(): {
  canvases: Record<FaceId, HTMLCanvasElement>
  version: number
} {
  const projectId = useCubeStore((s) => s.project.id)
  const version = useCubeStore((s) => s.faceTextureVersion)
  const facesFingerprint = useCubeStore((s) =>
    FACE_IDS.map((id) => JSON.stringify(s.project.faces[id].fabricJson)).join('\0'),
  )

  const prevJsonRef = useRef<Partial<Record<FaceId, string>>>({})
  const syncGenerationRef = useRef(0)
  const [canvases, setCanvases] = useState(createInitialCanvases)
  const canvasesRef = useRef(canvases)
  canvasesRef.current = canvases

  useEffect(() => {
    prevJsonRef.current = {}
  }, [projectId])

  useEffect(() => {
    const generation = ++syncGenerationRef.current
    let cancelled = false

    async function syncAll() {
      const faces = useCubeStore.getState().project.faces
      let updated = false

      for (const faceId of FACE_IDS) {
        if (cancelled || generation !== syncGenerationRef.current) return

        const jsonKey = faceJsonFingerprint(faces, faceId)
        if (prevJsonRef.current[faceId] === jsonKey) continue

        try {
          await renderFabricJsonToCanvas(faces[faceId].fabricJson, canvasesRef.current[faceId])
        } catch (err) {
          console.error(`[useFaceTextures] render failed for ${faceId}:`, err)
          continue
        }

        if (cancelled || generation !== syncGenerationRef.current) return

        prevJsonRef.current[faceId] = jsonKey
        updated = true
      }

      if (updated && !cancelled && generation === syncGenerationRef.current) {
        setCanvases({ ...canvasesRef.current })
        useCubeStore.getState().bumpFaceTextures()
      }
    }

    void syncAll()
    return () => {
      cancelled = true
    }
  }, [facesFingerprint, projectId])

  return {
    canvases,
    version,
  }
}
