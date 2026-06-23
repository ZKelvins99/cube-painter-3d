import { describe, it, expect } from 'vitest'
import {
  buildHingeTree,
  computeFlatPoses,
  computeHingePoses,
  computeHingePosesWithLinks,
  buildFaceScene,
  faceWorldNormal,
  getSubPanelFaces,
} from '@/animation/foldHierarchy'
import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'
import { FACE_IDS } from '@/types/cube'

/**
 * Physics-correct fold tests (vertical-direct model).
 *
 * Invariants:
 *  - The anchor `front` is pinned to its canonical cube pose from t=0: position
 *    [0,0,0.5], rotation [0,0,0]. It never moves.
 *  - Every face folds exactly +/-90° about its real shared edge.
 *  - t=1 lands EXACTLY on layout.cubePoses via pure hinge geometry (no snap/blend).
 */

describe('computeHingePoses — folded state (t=1)', () => {
  it('lands EXACTLY on target cube poses for all 11 layouts', () => {
    for (const layout of UNFOLD_LAYOUTS) {
      const folded = computeHingePoses(layout.id, 1)
      for (const faceId of FACE_IDS) {
        const a = folded[faceId].position
        const b = layout.cubePoses[faceId].position
        const dist = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
        expect(dist, `layout ${layout.id} face ${faceId} pos drift`).toBeLessThan(1e-4)
      }
    }
  })

  it('every face normal matches its cube target at t=1 for all 11 layouts', () => {
    const TARGET: Record<string, [number, number, number]> = {
      front: [0, 0, 1],
      back: [0, 0, -1],
      left: [-1, 0, 0],
      right: [1, 0, 0],
      top: [0, 1, 0],
      bottom: [0, -1, 0],
    }
    for (const layout of UNFOLD_LAYOUTS) {
      const links = buildHingeTree(layout)
      const { faceNodes } = buildFaceScene(layout, links, 1)
      for (const faceId of FACE_IDS) {
        const n = faceWorldNormal(faceNodes[faceId])
        const [tx, ty, tz] = TARGET[faceId]
        expect(n.x, `layout ${layout.id} ${faceId}.normal.x`).toBeCloseTo(tx, 5)
        expect(n.y, `layout ${layout.id} ${faceId}.normal.y`).toBeCloseTo(ty, 5)
        expect(n.z, `layout ${layout.id} ${faceId}.normal.z`).toBeCloseTo(tz, 5)
      }
    }
  })
})

describe('computeHingePoses — flat state (t=0)', () => {
  it('pins the anchor front to its canonical cube pose', () => {
    for (const layout of UNFOLD_LAYOUTS) {
      const flat = computeHingePoses(layout.id, 0)
      expect(flat.front.position[0]).toBeCloseTo(0, 6)
      expect(flat.front.position[1]).toBeCloseTo(0, 6)
      expect(flat.front.position[2]).toBeCloseTo(0.5, 6)
      expect(flat.front.rotation[0]).toBeCloseTo(0, 6)
      expect(flat.front.rotation[1]).toBeCloseTo(0, 6)
      expect(flat.front.rotation[2]).toBeCloseTo(0, 6)
    }
  })

  it('lays every face in the vertical plane (z = 0.5, rotation identity, normal +Z)', () => {
    for (const layout of UNFOLD_LAYOUTS) {
      const flat = computeFlatPoses(layout)
      for (const faceId of FACE_IDS) {
        expect(flat[faceId].position[2], `${faceId}.z`).toBeCloseTo(0.5, 6)
        expect(flat[faceId].rotation[0]).toBeCloseTo(0, 6)
        expect(flat[faceId].rotation[1]).toBeCloseTo(0, 6)
        expect(flat[faceId].rotation[2]).toBeCloseTo(0, 6)
      }
    }
  })

  it('hinge scene at rest (t≈0) reproduces the flat net for all layouts', () => {
    for (const layout of UNFOLD_LAYOUTS) {
      const flat = computeFlatPoses(layout)
      const hinge = computeHingePoses(layout.id, 1e-10)
      for (const faceId of FACE_IDS) {
        const d = Math.hypot(
          flat[faceId].position[0] - hinge[faceId].position[0],
          flat[faceId].position[1] - hinge[faceId].position[1],
          flat[faceId].position[2] - hinge[faceId].position[2],
        )
        expect(d, `layout ${layout.id} ${faceId}`).toBeLessThan(1e-4)
      }
    }
  })
})

describe('computeHingePoses — continuity (no snap/blend)', () => {
  it('is continuous in globalT (no jump near the end)', () => {
    const layout = UNFOLD_LAYOUTS[0]
    const before = computeHingePoses(layout.id, 0.999)
    const at = computeHingePoses(layout.id, 1)
    for (const faceId of FACE_IDS) {
      const d = Math.hypot(
        before[faceId].position[0] - at[faceId].position[0],
        before[faceId].position[1] - at[faceId].position[1],
        before[faceId].position[2] - at[faceId].position[2],
      )
      // The last step sweeps from y=0 to y=-0.5 (bottom), so a 0.001 gap is tiny.
      expect(d, `${faceId} continuity`).toBeLessThan(0.01)
    }
  })
})

describe('T layout 1 — analytical signs & step-fold geometry', () => {
  const layout = UNFOLD_LAYOUTS[0]

  it('resolves the expected physical hinge signs', () => {
    const links = buildHingeTree(layout)
    const signs = Object.fromEntries(links.map((l) => [l.faceId, l.sign]))
    expect(signs).toEqual({
      left: -1, // west of front, folds to -X normal
      right: 1, // east of front, folds to +X normal
      top: -1, // north of front, folds to +Y normal
      bottom: 1, // south of front, folds to -Y normal
      back: 1, // east of right (nested), folds to -Z normal
    })
  })

  it('after step 1 (left) the left face normal points -X', () => {
    const links = buildHingeTree(layout)
    const { faceNodes } = buildFaceScene(layout, links, 1 / 5 - 1e-3)
    const n = faceWorldNormal(faceNodes.left)
    expect(n.x).toBeCloseTo(-1, 4)
  })

  it('after step 5 (back) the back face normal points -Z', () => {
    const links = buildHingeTree(layout)
    const { faceNodes } = buildFaceScene(layout, links, 1 - 1e-3)
    const n = faceWorldNormal(faceNodes.back)
    expect(n.z).toBeCloseTo(-1, 4)
  })

  it('step-fold at 4/5 folds left/right/top panels out of the plane', () => {
    const links = buildHingeTree(layout)
    const mid = computeHingePosesWithLinks(layout, links, 0.8)
    // Each wall is at least one half-edge-length off the flat plane after folding.
    const off = (id: string) => {
      const p = mid[id as keyof typeof mid].position
      return Math.hypot(p[0], p[1]) > 0.25 || Math.abs(p[2] - 0.5) > 0.25
    }
    expect(off('left')).toBe(true)
    expect(off('right')).toBe(true)
    expect(off('top')).toBe(true)
  })
})

describe('getSubPanelFaces', () => {
  it('includes pivot and descendants for T-type layout 1', () => {
    const layout = UNFOLD_LAYOUTS[0]
    expect(getSubPanelFaces(layout, 'right')).toEqual(['right', 'back'])
    expect(getSubPanelFaces(layout, 'left')).toEqual(['left'])
  })

  it('each fold step pivot is not the anchor face', () => {
    for (const layout of UNFOLD_LAYOUTS) {
      for (const step of layout.foldSteps) {
        expect(step.pivotFace).not.toBe(layout.anchorFace)
      }
    }
  })
})
