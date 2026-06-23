import { Group, Line, Path, type TPointerEventInfo } from 'fabric'
import type { ToolApi } from '@/editor/snapping'

const ARROW_HEAD = 14

export function attachArrowTool(api: ToolApi) {
  const { canvas, snap, showSnap, clearOverlay, getStroke } = api
  let startX = 0
  let startY = 0
  let isDragging = false
  let previewLine: Line | null = null
  let previewHead: Path | null = null

  function makeHead(x1: number, y1: number, x2: number, y2: number): Path {
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const a1 = angle + Math.PI - 0.4
    const a2 = angle + Math.PI + 0.4
    const hx1 = x2 + Math.cos(a1) * ARROW_HEAD
    const hy1 = y2 + Math.sin(a1) * ARROW_HEAD
    const hx2 = x2 + Math.cos(a2) * ARROW_HEAD
    const hy2 = y2 + Math.sin(a2) * ARROW_HEAD
    return new Path(`M ${hx1.toFixed(1)} ${hy1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} L ${hx2.toFixed(1)} ${hy2.toFixed(1)}`, {
      ...getStroke(),
      fill: 'transparent',
      selectable: false,
      evented: false,
    })
  }

  const onDown = (opt: TPointerEventInfo) => {
    const p = canvas.getPointer(opt.e)
    const s = snap(p.x, p.y)
    startX = s.x
    startY = s.y
    isDragging = true
    showSnap(s.snapPoint)

    previewLine = new Line([startX, startY, startX, startY], {
      ...getStroke(),
      selectable: false,
      evented: false,
    })
    canvas.add(previewLine)
  }

  const onMove = (opt: TPointerEventInfo) => {
    if (!isDragging || !previewLine) return
    const p = canvas.getPointer(opt.e)
    const s = snap(p.x, p.y)
    showSnap(s.snapPoint)

    let x2 = s.x
    let y2 = s.y

    // Shift = 45° 约束
    if (opt.e.shiftKey) {
      const dx = x2 - startX
      const dy = y2 - startY
      const dist = Math.hypot(dx, dy)
      if (dist > 0) {
        const angle = Math.atan2(dy, dx)
        const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
        x2 = startX + Math.cos(snapped) * dist
        y2 = startY + Math.sin(snapped) * dist
      }
    }

    previewLine.set({ x2, y2 })
    previewLine.setCoords()

    if (previewHead) canvas.remove(previewHead)
    previewHead = makeHead(startX, startY, x2, y2)
    canvas.add(previewHead)
    canvas.requestRenderAll()
  }

  const onUp = (opt: TPointerEventInfo) => {
    if (!isDragging || !previewLine) return
    isDragging = false

    const p = canvas.getPointer(opt.e)
    const s = snap(p.x, p.y)
    let x2 = s.x
    let y2 = s.y

    if (opt.e.shiftKey) {
      const dx = x2 - startX
      const dy = y2 - startY
      const dist = Math.hypot(dx, dy)
      if (dist > 0) {
        const angle = Math.atan2(dy, dx)
        const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
        x2 = startX + Math.cos(snapped) * dist
        y2 = startY + Math.sin(snapped) * dist
      }
    }

    if (startX === x2 && startY === y2) {
      if (previewLine) canvas.remove(previewLine)
      if (previewHead) canvas.remove(previewHead)
    } else {
      const stroke = getStroke()
      const line = new Line([startX, startY, x2, y2], { ...stroke, selectable: true })
      const head = makeHead(startX, startY, x2, y2)
      head.set({ selectable: true, evented: true })
      const group = new Group([line, head], { selectable: true })
      canvas.remove(previewLine)
      if (previewHead) canvas.remove(previewHead)
      canvas.add(group)
    }

    previewLine = null
    previewHead = null
    clearOverlay()
    canvas.requestRenderAll()
  }

  canvas.on('mouse:down', onDown)
  canvas.on('mouse:move', onMove)
  canvas.on('mouse:up', onUp)
  return () => {
    if (previewLine) canvas.remove(previewLine)
    if (previewHead) canvas.remove(previewHead)
    canvas.off('mouse:down', onDown)
    canvas.off('mouse:move', onMove)
    canvas.off('mouse:up', onUp)
    clearOverlay()
  }
}
