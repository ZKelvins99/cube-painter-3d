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
  })

  try {
    try {
      await fabric.loadFromJSON(fabricJson)
    } catch {
      await fabric.loadFromJSON(emptyFabricJson())
    }
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
