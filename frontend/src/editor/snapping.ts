/**
 * 综合吸附引擎 — 支持角点、边中点、中心、对象端点/中点、网格吸附。
 */
import type { Canvas, Point as FabricPoint } from 'fabric'
import { FACE_SIZE } from '@/lib/faceCanvas'
import { useCubeStore } from '@/store/cubeStore'
import type { DashStyle } from '@/types/cube'

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

export type SnapType =
  | 'grid'
  | 'corner'
  | 'edge-mid'
  | 'center'
  | 'object-end'
  | 'object-mid'
  | 'quarter'

export interface SnapPoint {
  x: number
  y: number
  type: SnapType
}

export interface SnapResult {
  x: number
  y: number
  snapPoint: SnapPoint | null
}

export interface StrokeProps {
  stroke: string
  strokeWidth: number
  strokeDashArray?: number[]
}

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

const SNAP_THRESHOLD = 12
const GRID_SIZE = 8

const SNAP_COLORS: Record<SnapType, string> = {
  corner: '#ef4444',
  'edge-mid': '#22c55e',
  center: '#3b82f6',
  'object-end': '#f97316',
  'object-mid': '#a855f7',
  quarter: '#64748b',
  grid: '#94a3b8',
}

// ---------------------------------------------------------------------------
// 描边属性
// ---------------------------------------------------------------------------

export function getDashArray(style: DashStyle): number[] | undefined {
  return style === 'dashed' ? [8, 4] : style === 'dotted' ? [2, 4] : undefined
}

export function getStrokeProps(): StrokeProps {
  const s = useCubeStore.getState()
  return {
    stroke: s.strokeColor,
    strokeWidth: s.strokeWidth,
    strokeDashArray: getDashArray(s.dashStyle),
  }
}

// ---------------------------------------------------------------------------
// 吸附点收集
// ---------------------------------------------------------------------------

/** 面的静态吸附点：4 角、4 边中点、4 四分点、1 中心 */
function getFaceSnapPoints(): SnapPoint[] {
  const S = FACE_SIZE
  const H = S / 2
  const Q = S / 4
  return [
    // 角点
    { x: 0, y: 0, type: 'corner' },
    { x: S, y: 0, type: 'corner' },
    { x: S, y: S, type: 'corner' },
    { x: 0, y: S, type: 'corner' },
    // 边中点
    { x: H, y: 0, type: 'edge-mid' },
    { x: S, y: H, type: 'edge-mid' },
    { x: H, y: S, type: 'edge-mid' },
    { x: 0, y: H, type: 'edge-mid' },
    // 中心
    { x: H, y: H, type: 'center' },
    // 四分点
    { x: Q, y: 0, type: 'quarter' },
    { x: 3 * Q, y: 0, type: 'quarter' },
    { x: S, y: Q, type: 'quarter' },
    { x: S, y: 3 * Q, type: 'quarter' },
    { x: 3 * Q, y: S, type: 'quarter' },
    { x: Q, y: S, type: 'quarter' },
    { x: 0, y: 3 * Q, type: 'quarter' },
    { x: 0, y: Q, type: 'quarter' },
  ]
}

/** 从画布现有对象收集吸附点 */
function getObjectSnapPoints(canvas: Canvas): SnapPoint[] {
  const points: SnapPoint[] = []
  for (const obj of canvas.getObjects()) {
    if (!obj.selectable) continue

    // 边界框角点
    const coords = obj.getCoords() as FabricPoint[]
    if (coords && coords.length >= 4) {
      for (const c of coords) {
        points.push({ x: c.x, y: c.y, type: 'object-end' })
      }
      // 边中点
      const [tl, tr, br, bl] = coords
      points.push({ x: (tl.x + tr.x) / 2, y: (tl.y + tr.y) / 2, type: 'object-mid' })
      points.push({ x: (tr.x + br.x) / 2, y: (tr.y + br.y) / 2, type: 'object-mid' })
      points.push({ x: (br.x + bl.x) / 2, y: (br.y + bl.y) / 2, type: 'object-mid' })
      points.push({ x: (bl.x + tl.x) / 2, y: (bl.y + tl.y) / 2, type: 'object-mid' })
    }

    // 中心点
    const center = obj.getCenterPoint()
    points.push({ x: center.x, y: center.y, type: 'center' })
  }
  return points
}

// ---------------------------------------------------------------------------
// 主吸附函数
// ---------------------------------------------------------------------------

export function snapPoint(x: number, y: number, canvas: Canvas): SnapResult {
  const state = useCubeStore.getState()
  if (!state.snapEnabled) {
    return { x, y, snapPoint: null }
  }

  const allPoints = [...getFaceSnapPoints(), ...getObjectSnapPoints(canvas)]

  let best: SnapPoint | null = null
  let bestDist = SNAP_THRESHOLD

  for (const sp of allPoints) {
    const dist = Math.hypot(sp.x - x, sp.y - y)
    if (dist < bestDist) {
      bestDist = dist
      best = sp
    }
  }

  if (best) {
    return { x: best.x, y: best.y, snapPoint: best }
  }

  // 网格回退
  const gx = Math.round(x / GRID_SIZE) * GRID_SIZE
  const gy = Math.round(y / GRID_SIZE) * GRID_SIZE
  return { x: gx, y: gy, snapPoint: { x: gx, y: gy, type: 'grid' } }
}

// ---------------------------------------------------------------------------
// 覆盖层绘制
// ---------------------------------------------------------------------------

/** 在 2D 上下文上绘制吸附指示器 */
export function drawSnapIndicator(
  ctx: CanvasRenderingContext2D,
  point: SnapPoint | null,
) {
  if (!point) return

  const { x, y, type } = point
  const color = SNAP_COLORS[type] ?? '#94a3b8'

  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1.5

  if (type === 'corner') {
    ctx.strokeRect(x - 5, y - 5, 10, 10)
  } else if (type === 'edge-mid') {
    ctx.beginPath()
    ctx.moveTo(x, y - 5)
    ctx.lineTo(x - 5, y + 4)
    ctx.lineTo(x + 5, y + 4)
    ctx.closePath()
    ctx.stroke()
  } else if (type === 'center') {
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.stroke()
  } else if (type === 'object-end') {
    ctx.beginPath()
    ctx.moveTo(x, y - 5)
    ctx.lineTo(x + 5, y)
    ctx.lineTo(x, y + 5)
    ctx.lineTo(x - 5, y)
    ctx.closePath()
    ctx.stroke()
  } else if (type === 'object-mid') {
    ctx.beginPath()
    ctx.moveTo(x - 5, y - 5)
    ctx.lineTo(x + 5, y + 5)
    ctx.moveTo(x + 5, y - 5)
    ctx.lineTo(x - 5, y + 5)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

/** 在覆盖层上绘制网格 */
export function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.06)'
  ctx.lineWidth = 0.5

  for (let x = 0; x <= FACE_SIZE; x += GRID_SIZE) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, FACE_SIZE)
    ctx.stroke()
  }
  for (let y = 0; y <= FACE_SIZE; y += GRID_SIZE) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(FACE_SIZE, y)
    ctx.stroke()
  }

  // 四分线（更明显）
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.12)'
  ctx.lineWidth = 1
  const Q = FACE_SIZE / 4
  for (let i = 1; i < 4; i++) {
    ctx.beginPath()
    ctx.moveTo(i * Q, 0)
    ctx.lineTo(i * Q, FACE_SIZE)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i * Q)
    ctx.lineTo(FACE_SIZE, i * Q)
    ctx.stroke()
  }

  ctx.restore()
}

// ---------------------------------------------------------------------------
// 工具 API
// ---------------------------------------------------------------------------

export interface ToolApi {
  canvas: Canvas
  overlayCtx: CanvasRenderingContext2D | null
  snap: (x: number, y: number) => SnapResult
  showSnap: (point: SnapPoint | null) => void
  clearOverlay: () => void
  getStroke: () => StrokeProps
}

export function createToolApi(
  canvas: Canvas,
  overlayCtx: CanvasRenderingContext2D | null,
): ToolApi {
  const clearOverlay = () => {
    if (!overlayCtx) return
    overlayCtx.clearRect(0, 0, FACE_SIZE, FACE_SIZE)
    const state = useCubeStore.getState()
    if (state.showGrid) drawGrid(overlayCtx)
  }

  const showSnap = (point: SnapPoint | null) => {
    clearOverlay()
    if (point) drawSnapIndicator(overlayCtx!, point)
  }

  return {
    canvas,
    overlayCtx,
    snap: (x, y) => snapPoint(x, y, canvas),
    showSnap,
    clearOverlay,
    getStroke: getStrokeProps,
  }
}
