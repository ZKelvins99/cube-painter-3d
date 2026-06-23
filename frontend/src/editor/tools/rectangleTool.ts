import { Rect, type TPointerEventInfo } from 'fabric'
import type { ToolApi } from '@/editor/snapping'

export function attachRectangleTool(api: ToolApi) {
  const { canvas, snap, showSnap, clearOverlay, getStroke } = api
  let startX = 0
  let startY = 0
  let preview: Rect | null = null

  const onDown = (opt: TPointerEventInfo) => {
    const p = canvas.getPointer(opt.e)
    const s = snap(p.x, p.y)
    startX = s.x
    startY = s.y
    showSnap(s.snapPoint)

    preview = new Rect({
      left: startX,
      top: startY,
      width: 0,
      height: 0,
      ...getStroke(),
      fill: 'transparent',
      selectable: false,
      evented: false,
    })
    canvas.add(preview)
  }

  const onMove = (opt: TPointerEventInfo) => {
    if (!preview) return
    const p = canvas.getPointer(opt.e)
    const s = snap(p.x, p.y)
    showSnap(s.snapPoint)

    const left = Math.min(startX, s.x)
    const top = Math.min(startY, s.y)
    const w = Math.abs(s.x - startX)
    const h = Math.abs(s.y - startY)

    // Shift = 正方形
    let finalW = w
    let finalH = h
    if (opt.e.shiftKey) {
      const size = Math.max(w, h)
      finalW = size
      finalH = size
    }

    preview.set({ left, top, width: finalW, height: finalH })
    preview.setCoords()
    canvas.requestRenderAll()
  }

  const onUp = () => {
    if (!preview) return
    if (preview.width < 2 || preview.height < 2) {
      canvas.remove(preview)
    } else {
      preview.set({ selectable: true, evented: true })
    }
    preview = null
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
