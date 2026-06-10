import { Canvas, Line, Point, type TPointerEventInfo } from 'fabric'

const GRID = 8

export function snap(v: number) {
  return Math.round(v / GRID) * GRID
}

function constrainEnd(
  start: Point,
  x2: number,
  y2: number,
  shiftKey: boolean,
): { x: number; y: number } {
  if (!shiftKey) {
    return { x: x2, y: y2 }
  }

  const dx = x2 - start.x
  const dy = y2 - start.y
  const dist = Math.hypot(dx, dy)
  if (dist === 0) {
    return { x: x2, y: y2 }
  }

  const angle = Math.atan2(dy, dx)
  const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
  return {
    x: snap(start.x + Math.cos(snappedAngle) * dist),
    y: snap(start.y + Math.sin(snappedAngle) * dist),
  }
}

export function attachLineTool(canvas: Canvas) {
  let start: Point | null = null

  const onDown = (opt: TPointerEventInfo) => {
    const p = canvas.getPointer(opt.e)
    start = new Point(snap(p.x), snap(p.y))
  }

  const onUp = (opt: TPointerEventInfo) => {
    if (!start) return
    const p = canvas.getPointer(opt.e)
    let x2 = snap(p.x)
    let y2 = snap(p.y)
    ;({ x: x2, y: y2 } = constrainEnd(start, x2, y2, opt.e.shiftKey))

    if (start.x === x2 && start.y === y2) {
      start = null
      return
    }

    canvas.add(
      new Line([start.x, start.y, x2, y2], {
        stroke: '#111827',
        strokeWidth: 3,
        selectable: true,
      }),
    )
    start = null
    canvas.requestRenderAll()
  }

  canvas.on('mouse:down', onDown)
  canvas.on('mouse:up', onUp)
  return () => {
    canvas.off('mouse:down', onDown)
    canvas.off('mouse:up', onUp)
  }
}
