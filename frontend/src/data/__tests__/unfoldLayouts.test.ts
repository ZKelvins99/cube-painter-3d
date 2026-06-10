import { describe, it, expect } from 'vitest'
import { UNFOLD_LAYOUTS } from '../unfoldLayouts'
import { FACE_IDS } from '@/types/cube'

describe('UNFOLD_LAYOUTS', () => {
  it('has exactly 11 layouts', () => {
    expect(UNFOLD_LAYOUTS).toHaveLength(11)
  })

  it('each layout has 6 unique faces matching FACE_IDS', () => {
    for (const layout of UNFOLD_LAYOUTS) {
      const ids = layout.cells.map((c) => c.faceId)
      expect(new Set(ids).size).toBe(6)
      expect(ids.sort()).toEqual([...FACE_IDS].sort())
    }
  })

  it('each layout defines anchorFace and foldSteps', () => {
    for (const layout of UNFOLD_LAYOUTS) {
      expect(FACE_IDS).toContain(layout.anchorFace)
      expect(layout.foldSteps.length).toBeGreaterThan(0)
      expect(layout.cells.some((c) => c.faceId === layout.anchorFace)).toBe(true)
    }
  })
})
