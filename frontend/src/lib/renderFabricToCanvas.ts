import { StaticCanvas } from 'fabric'
import { emptyFabricJson } from '@/lib/emptyFaceJson'
import { FACE_SIZE } from '@/lib/faceCanvas'

/** Render Fabric JSON into a 2D canvas (same pixel layout as the 2D editor). */
export async function renderFabricJsonToCanvas(
  fabricJson: object,
  target: HTMLCanvasElement,
  size = FACE_SIZE,
): Promise<void> {
  const el = document.createElement('canvas')
  el.width = size
  el.height = size

  const fabric = new StaticCanvas(el, {
    width: size,
    height: size,
    backgroundColor: '#ffffff',
    renderOnAddRemove: false,
  })

  try {
    const payload =
      typeof fabricJson === 'object' && fabricJson !== null ? fabricJson : emptyFabricJson()
    try {
      await fabric.loadFromJSON(payload)
    } catch {
      await fabric.loadFromJSON(emptyFabricJson())
    }
    fabric.backgroundColor = '#ffffff'
    fabric.requestRenderAll()

    const ctx = target.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    const rendered = fabric.toCanvasElement(1, { width: size, height: size })
    ctx.drawImage(rendered, 0, 0, size, size)
  } finally {
    fabric.dispose()
  }
}

export function faceJsonFingerprint(faces: Record<string, { fabricJson: object }>, faceId: string): string {
  return JSON.stringify(faces[faceId]?.fabricJson ?? emptyFabricJson())
}
