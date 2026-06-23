import { Canvas, Line, Point, type TPointerEventInfo } from 'fabric'
import type { ToolApi } from '@/editor/snapping'

const GRID = 8

/** @internal 保留旧 API 兼容（测试可能引用） */
export function snap(v: number) {
  return Math.round(v / GRID) * GRID
}

function constrainEnd(
  start: Point,
  x2: number,
  y2: number,
  shiftKey: boolean,
) {
  if (!shiftKey) return { x: x2, y: y2 }

  const dx = x2 - start.x
  const dy = y2 - start.y
  const dist = Math.hypot(dx, dy)
  if (dist === 0) return { x: x2, y: y2 }

  const angle = Math.atan2(dy, dx)
  const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
  return {
    x: start.x + Math.cos(snappedAngle) * dist,
    y: start.y + Math.sin(snappedAngle) * dist,
  }
}

export function attachLineTool(api: ToolApi) {
  const { canvas, snap: snapFn, showSnap, clearOverlay, getStroke } = api
  let start: Point | null = null

  const onDown = (opt: TPointerEventInfo) => {
    const p = canvas.getPointer(opt.e)
    const s = snapFn(p.x, p.y)
    start = new Point(s.x, s.y)
    showSnap(s.snapPoint)
  }

  const onMove = (opt: TPointerEventInfo) => {
    if (!start) return
    const p = canvas.getPointer(opt.e)
    const s = snapFn(p.x, p.y)
    showSnap(s.snapPoint)
  }

  const onUp = (opt: TPointerEventInfo) => {
    if (!start) return
    const p = canvas.getPointer(opt.e)
    const s = snapFn(p.x, p.y)
    let x2 = s.x
    let y2 = s.y
    ;({ x: x2, y: y2 } = constrainEnd(start, x2, y2, opt.e.shiftKey))

    if (start.x === x2 && start.y === y2) {
      start = null
      clearOverlay()
      return
    }

    canvas.add(
      new Line([start.x, start.y, x2, y2], {
        ...getStroke(),
        selectable: true,
      }),
    )
    start = null
    clearOverlay()
    canvas.requestRenderAll()
  }

  canvas.on('mouse:down', onDown)
  canvas.on('mouse:move', onMove)
  canvas.on('mouse:up', onUp)
  return () => {
    canvas.off('mouse:down', onDown)
    canvas.off('mouse:move', onMove)
    canvas.off('mouse:up', onUp)
    clearOverlay()
  }
}
