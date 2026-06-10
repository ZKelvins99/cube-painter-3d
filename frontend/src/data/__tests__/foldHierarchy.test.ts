import { describe, it, expect } from 'vitest'
import { computeHingePoses, getSubPanelFaces } from '@/animation/foldHierarchy'
import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'
import { FACE_IDS } from '@/types/cube'

describe('computeHingePoses', () => {
  it('folded state (t=1) matches target cube poses for all 11 layouts when snap enabled', () => {
    for (const layout of UNFOLD_LAYOUTS) {
      const folded = computeHingePoses(layout.id, 1, { snapToCube: true })
      for (const faceId of FACE_IDS) {
        const a = folded[faceId].position
        const b = layout.cubePoses[faceId].position
        const dist = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
        expect(dist).toBeLessThan(0.15)
      }
    }
  })

  it('flat state (t=0) keeps all faces on the ground plane', () => {
    const flat = computeHingePoses(1, 0)
    for (const faceId of FACE_IDS) {
      expect(Math.abs(flat[faceId].position[1])).toBeLessThan(0.01)
    }
  })

  it('step-fold mid progress does not snap-blend toward cube poses', () => {
    const mid = computeHingePoses(1, 0.9, { snapToCube: false })
    const snapped = computeHingePoses(1, 0.9, { snapToCube: true })
    const midDist = Math.hypot(
      mid.front.position[0] - snapped.front.position[0],
      mid.front.position[1] - snapped.front.position[1],
      mid.front.position[2] - snapped.front.position[2],
    )
    expect(midDist).toBeGreaterThan(0.001)
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
