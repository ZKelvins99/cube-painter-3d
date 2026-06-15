import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { buildFaceScene, buildHingeTreeRaw, faceWorldNormal } from '@/animation/foldHierarchy'
import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'

function withSigns(bottomSign: number) {
  const layout = UNFOLD_LAYOUTS[0]
  const links = buildHingeTreeRaw(layout)
  for (const link of links) {
    if (link.faceId === 'left') link.sign = 1
    else if (link.faceId === 'right') link.sign = -1
    else if (link.faceId === 'top') link.sign = 1
    else if (link.faceId === 'back') link.sign = -1
    else if (link.faceId === 'bottom') link.sign = bottomSign
    else link.sign = 1
  }
  return { layout, links }
}

describe('T layout hinge signs', () => {
  it('back sign -1 faces -Z at step 3 end', () => {
    const { layout, links } = withSigns(1)
    const { faceNodes } = buildFaceScene(layout, links, 0.599)
    const backN = faceWorldNormal(faceNodes.back)
    expect(backN.dot(new THREE.Vector3(0, 0, -1))).toBeGreaterThan(0.9)
  })

  it('bottom sign +1 folds downward at step 5', () => {
    const { layout: l1, links: k1 } = withSigns(1)
    const { layout: l2, links: k2 } = withSigns(-1)
    const downY = buildFaceScene(l1, k1, 0.999).faceNodes.bottom.getWorldPosition(new THREE.Vector3()).y
    const upY = buildFaceScene(l2, k2, 0.999).faceNodes.bottom.getWorldPosition(new THREE.Vector3()).y
    expect(downY).toBeLessThan(0)
    expect(upY).toBeGreaterThan(0)
  })
})
