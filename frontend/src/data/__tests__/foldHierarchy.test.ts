import { describe, it, expect } from 'vitest'
import { computeHingePoses } from '@/animation/foldHierarchy'
import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'
import { FACE_IDS } from '@/types/cube'

describe('computeHingePoses', () => {
  it('folded state (t=1) matches target cube poses for all 11 layouts', () => {
    for (const layout of UNFOLD_LAYOUTS) {
      const folded = computeHingePoses(layout.id, 1)
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
})
