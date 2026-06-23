import { Circle, Group, Line, Path, Rect } from 'fabric'
import { FACE_SIZE } from '@/lib/faceCanvas'

export type ShapeKey =
  | 'diagonal'
  | 'cross'
  | 'parallel'
  | 'triangle'
  | 'threeDots'
  | 'semiArc'
  | 'squareOutline'
  | 'circleOutline'
  | 'arrow'
  | 'star'
  | 'concentric'
  | 'zigzag'

const STROKE = '#111827'
const STROKE_WIDTH = 3
const HALF = 40

function centeredGroup(objects: (Line | Circle | Path | Rect)[]) {
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
  diagonal: () => centeredGroup([line(-HALF, -HALF, HALF, HALF)]),

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

  squareOutline: () =>
    centeredGroup([
      new Rect({
        left: -HALF,
        top: -HALF,
        width: HALF * 2,
        height: HALF * 2,
        stroke: STROKE,
        strokeWidth: STROKE_WIDTH,
        fill: 'transparent',
      }),
    ]),

  circleOutline: () =>
    centeredGroup([
      new Circle({
        left: 0,
        top: 0,
        radius: HALF,
        stroke: STROKE,
        strokeWidth: STROKE_WIDTH,
        fill: 'transparent',
        originX: 'center',
        originY: 'center',
      }),
    ]),

  arrow: () =>
    centeredGroup([
      line(-HALF, 0, HALF - 8, 0),
      new Path(`M ${HALF - 14} -8 L ${HALF} 0 L ${HALF - 14} 8`, {
        fill: '',
        stroke: STROKE,
        strokeWidth: STROKE_WIDTH,
      }),
    ]),

  star: () => {
    const pts: [number, number][] = []
    const outer = HALF
    const inner = HALF * 0.4
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outer : inner
      const a = (Math.PI / 5) * i - Math.PI / 2
      pts.push([Math.cos(a) * r, Math.sin(a) * r])
    }
    const segs = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
    return centeredGroup([
      new Path(`${segs} Z`, { fill: '', stroke: STROKE, strokeWidth: STROKE_WIDTH }),
    ])
  },

  concentric: () =>
    centeredGroup([
      new Rect({
        left: -HALF,
        top: -HALF,
        width: HALF * 2,
        height: HALF * 2,
        stroke: STROKE,
        strokeWidth: STROKE_WIDTH,
        fill: 'transparent',
      }),
      new Rect({
        left: -HALF * 0.6,
        top: -HALF * 0.6,
        width: HALF * 1.2,
        height: HALF * 1.2,
        stroke: STROKE,
        strokeWidth: STROKE_WIDTH,
        fill: 'transparent',
      }),
    ]),

  zigzag: () => {
    const segs = [-HALF, -HALF / 2, 0, HALF / 2, HALF]
      .map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${i % 2 === 0 ? -HALF / 2 : HALF / 2}`)
      .join(' ')
    return centeredGroup([new Path(segs, { fill: '', stroke: STROKE, strokeWidth: STROKE_WIDTH })])
  },
}

export const SHAPE_LABELS: Record<ShapeKey, string> = {
  diagonal: '对角线',
  cross: '十字',
  parallel: '平行线',
  triangle: '三角',
  threeDots: '三点',
  semiArc: '半弧',
  squareOutline: '方框',
  circleOutline: '圆框',
  arrow: '箭头',
  star: '五角星',
  concentric: '同心方',
  zigzag: '锯齿',
}
