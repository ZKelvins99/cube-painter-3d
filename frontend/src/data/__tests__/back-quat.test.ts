import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { buildFaceScene, buildHingeTree, faceWorldNormal } from '@/animation/foldHierarchy'
import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'

/**
 * Regression tests for nested / vertical hinge orientation on T layout 1.
 *
 * The analytical sign resolver now derives (vertical-direct model):
 *   back:   +1  (east of `right`; folds about right's folded east edge to -Z normal)
 *   bottom: +1  (south of `front`; folds about the world-X edge to -Y normal)
 * These tests pin those values and the resulting world normals/positions.
 */
describe('T layout hinge signs (analytical, vertical-direct model)', () => {
  const layout = UNFOLD_LAYOUTS[0]

  it('resolves back=+1 and bottom=+1', () => {
    const links = buildHingeTree(layout)
    const byId = Object.fromEntries(links.map((l) => [l.faceId, l.sign]))
    expect(byId.back).toBe(1)
    expect(byId.bottom).toBe(1)
  })

  it('back face normal points -Z at the end of step 3 (nested hinge)', () => {
    const links = buildHingeTree(layout)
    const { faceNodes } = buildFaceScene(layout, links, 3 / 5 - 1e-3)
    const backN = faceWorldNormal(faceNodes.back)
    expect(backN.dot(new THREE.Vector3(0, 0, -1))).toBeGreaterThan(0.99)
  })

  it('bottom face ends below the cube center (world Y < 0) at step 5', () => {
    const links = buildHingeTree(layout)
    const { faceNodes } = buildFaceScene(layout, links, 1)
    const y = faceNodes.bottom.getWorldPosition(new THREE.Vector3()).y
    expect(y).toBeLessThan(-0.25)
  })

  it('back face lands at the cube back position [0,0,-0.5] at t=1', () => {
    const links = buildHingeTree(layout)
    const { faceNodes } = buildFaceScene(layout, links, 1)
    const p = faceNodes.back.getWorldPosition(new THREE.Vector3())
    expect(p.x).toBeCloseTo(0, 4)
    expect(p.y).toBeCloseTo(0, 4)
    expect(p.z).toBeCloseTo(-0.5, 4)
  })
})
