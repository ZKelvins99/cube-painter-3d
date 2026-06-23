import type { TPointerEventInfo } from 'fabric'
import type { ToolApi } from '@/editor/snapping'

export function attachEraserTool(api: ToolApi) {
  const { canvas } = api

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
