import { Circle, Group, Line, Path } from 'fabric'
import { FACE_SIZE } from '@/lib/faceCanvas'

export type ShapeKey =
  | 'diagonal'
  | 'cross'
  | 'parallel'
  | 'triangle'
  | 'threeDots'
  | 'semiArc'

const STROKE = '#111827'
const STROKE_WIDTH = 3
const HALF = 40

function centeredGroup(objects: (Line | Circle | Path)[]) {
  const cx = FACE_SIZE / 2
  const cy = FACE_SIZE / 2
  return new Group(objects, {
    left: cx,
    top: cy,
    originX: 'center',
    originY: 'center',
    selectable: true,
  })
}

function line(x1: number, y1: number, x2: number, y2: number) {
  return new Line([x1, y1, x2, y2], {
    stroke: STROKE,
    strokeWidth: STROKE_WIDTH,
  })
}

export const SHAPES: Record<ShapeKey, () => Group> = {
  diagonal: () =>
    centeredGroup([line(-HALF, -HALF, HALF, HALF)]),

  cross: () =>
    centeredGroup([
      line(-HALF, 0, HALF, 0),
      line(0, -HALF, 0, HALF),
    ]),

  parallel: () =>
    centeredGroup([
      line(-16, -HALF, -16, HALF),
      line(16, -HALF, 16, HALF),
    ]),

  triangle: () =>
    centeredGroup([
      line(-HALF, HALF, HALF, HALF),
      line(HALF, HALF, HALF, -HALF),
      line(-HALF, HALF, HALF, -HALF),
    ]),

  threeDots: () =>
    centeredGroup([
      new Circle({ left: -24, top: 0, radius: 6, fill: STROKE, originX: 'center', originY: 'center' }),
      new Circle({ left: 0, top: 0, radius: 6, fill: STROKE, originX: 'center', originY: 'center' }),
      new Circle({ left: 24, top: 0, radius: 6, fill: STROKE, originX: 'center', originY: 'center' }),
    ]),

  semiArc: () =>
    centeredGroup([
      new Path(`M ${-HALF} 8 A ${HALF} ${HALF} 0 0 1 ${HALF} 8`, {
        fill: '',
        stroke: STROKE,
        strokeWidth: STROKE_WIDTH,
      }),
    ]),
}

export const SHAPE_LABELS: Record<ShapeKey, string> = {
  diagonal: '对角线',
  cross: '十字',
  parallel: '平行线',
  triangle: '三角',
  threeDots: '三点',
  semiArc: '半弧',
}
