import { Canvas, type TPointerEventInfo } from 'fabric'

export function attachEraserTool(canvas: Canvas) {
  const onDown = (opt: TPointerEventInfo) => {
    const target = opt.target
    if (!target) return
    canvas.remove(target)
    canvas.requestRenderAll()
  }

  canvas.on('mouse:down', onDown)
  return () => {
    canvas.off('mouse:down', onDown)
  }
}
