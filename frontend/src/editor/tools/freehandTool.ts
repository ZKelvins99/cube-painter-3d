import { Polyline, type TPointerEventInfo } from 'fabric'
import type { ToolApi } from '@/editor/snapping'

export function attachFreehandTool(api: ToolApi) {
  const { canvas, clearOverlay, getStroke } = api
  let points: { x: number; y: number }[] = []
  let preview: Polyline | null = null
  let isDrawing = false

  const onDown = (opt: TPointerEventInfo) => {
    const p = canvas.getPointer(opt.e)
    points = [{ x: p.x, y: p.y }]
    isDrawing = true

    preview = new Polyline(points, {
      ...getStroke(),
      fill: 'transparent',
      selectable: false,
      evented: false,
    })
    canvas.add(preview)
  }

  const onMove = (opt: TPointerEventInfo) => {
    if (!isDrawing || !preview) return
    const p = canvas.getPointer(opt.e)
    const last = points[points.length - 1]
    // 跳过过近的点（性能优化）
    if (Math.hypot(p.x - last.x, p.y - last.y) < 2) return
    points.push({ x: p.x, y: p.y })
    preview.set({ points: [...points] })
    preview.setCoords()
    canvas.requestRenderAll()
  }

  const onUp = () => {
    if (!isDrawing || !preview) return
    isDrawing = false

    if (points.length < 2) {
      canvas.remove(preview)
    } else {
      preview.set({ selectable: true, evented: true })
    }
    preview = null
    points = []
    clearOverlay()
    canvas.requestRenderAll()
  }

  canvas.on('mouse:down', onDown)
  canvas.on('mouse:move', onMove)
  canvas.on('mouse:up', onUp)
  return () => {
    if (preview) canvas.remove(preview)
    canvas.off('mouse:down', onDown)
    canvas.off('mouse:move', onMove)
    canvas.off('mouse:up', onUp)
    clearOverlay()
  }
}
