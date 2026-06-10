import { Canvas, Line, Polyline, Point, type TPointerEventInfo } from 'fabric'
import { snap } from '@/editor/tools/lineTool'

const STROKE = { stroke: '#111827', strokeWidth: 3, selectable: true }

export function attachPolylineTool(canvas: Canvas) {
  let points: Point[] = []
  let preview: Line | null = null

  const clearPreview = () => {
    if (preview) {
      canvas.remove(preview)
      preview = null
    }
  }

  const cancel = () => {
    points = []
    clearPreview()
    canvas.requestRenderAll()
  }

  const finish = () => {
    if (points.length < 2) {
      cancel()
      return
    }

    clearPreview()
    canvas.add(
      new Polyline(
        points.map((p) => ({ x: p.x, y: p.y })),
        { ...STROKE, fill: '' },
      ),
    )
    points = []
    canvas.requestRenderAll()
  }

  const updatePreview = (x: number, y: number) => {
    if (points.length === 0) return

    const last = points[points.length - 1]
    if (!preview) {
      preview = new Line([last.x, last.y, x, y], {
        ...STROKE,
        selectable: false,
        evented: false,
        strokeDashArray: [6, 4],
      })
      canvas.add(preview)
    } else {
      preview.set({ x1: last.x, y1: last.y, x2: x, y2: y })
      preview.setCoords()
    }
    canvas.requestRenderAll()
  }

  const onDown = (opt: TPointerEventInfo) => {
    if (opt.e.detail >= 2) {
      finish()
      return
    }

    const p = canvas.getPointer(opt.e)
    const pt = new Point(snap(p.x), snap(p.y))
    if (points.length > 0) {
      const last = points[points.length - 1]
      if (last.x === pt.x && last.y === pt.y) return
    }

    points.push(pt)
    updatePreview(pt.x, pt.y)
  }

  const onMove = (opt: TPointerEventInfo) => {
    if (points.length === 0) return
    const p = canvas.getPointer(opt.e)
    updatePreview(snap(p.x), snap(p.y))
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      finish()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  }

  canvas.on('mouse:down', onDown)
  canvas.on('mouse:move', onMove)
  window.addEventListener('keydown', onKeyDown)

  return () => {
    cancel()
    canvas.off('mouse:down', onDown)
    canvas.off('mouse:move', onMove)
    window.removeEventListener('keydown', onKeyDown)
  }
}
