import { Circle, type TPointerEventInfo } from 'fabric'
import type { ToolApi } from '@/editor/snapping'

export function attachCircleTool(api: ToolApi) {
  const { canvas, snap, showSnap, clearOverlay, getStroke } = api
  let startX = 0
  let startY = 0
  let preview: Circle | null = null

  const onDown = (opt: TPointerEventInfo) => {
    const p = canvas.getPointer(opt.e)
    const s = snap(p.x, p.y)
    startX = s.x
    startY = s.y
    showSnap(s.snapPoint)

    preview = new Circle({
      left: startX,
      top: startY,
      radius: 0,
      originX: 'left',
      originY: 'top',
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

    const dx = s.x - startX
    const dy = s.y - startY
    let radius = Math.hypot(dx, dy) / 2

    // Shift = 从中心出发
    if (opt.e.shiftKey) {
      radius = Math.hypot(dx, dy)
      preview.set({
        left: startX - radius,
        top: startY - radius,
        radius,
      })
    } else {
      preview.set({
        left: Math.min(startX, s.x),
        top: Math.min(startY, s.y),
        radius,
      })
    }
    preview.setCoords()
    canvas.requestRenderAll()
  }

  const onUp = () => {
    if (!preview) return
    if (preview.radius < 2) {
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
