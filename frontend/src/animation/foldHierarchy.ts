import * as THREE from 'three'
import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'
import type { FaceId, FacePose3D, UnfoldCell, UnfoldLayout, UnfoldType } from '@/types/cube'
import { FACE_IDS } from '@/types/cube'

const HALF = 0.5
const FLAT_QUAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
const ALIGN_START = 0.82

/** Target outward face normals once the net is fully folded into a cube (world space). */
const CUBE_FACE_NORMALS: Record<FaceId, THREE.Vector3> = {
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1),
  left: new THREE.Vector3(-1, 0, 0),
  right: new THREE.Vector3(1, 0, 0),
  top: new THREE.Vector3(0, 1, 0),
  bottom: new THREE.Vector3(0, -1, 0),
}

export type FoldPoseOptions = {
  /** When true (fast fold), blend toward ideal cube poses near the end. Step-fold should pass false. */
  snapToCube?: boolean
}

type EdgeDir = 'east' | 'west' | 'north' | 'south'

export type HingeLink = {
  faceId: FaceId
  parent: FaceId
  edge: EdgeDir
  sign: number
}

function cellMap(layout: UnfoldLayout): Map<FaceId, UnfoldCell> {
  return new Map(layout.cells.map((c) => [c.faceId, c]))
}

function neighborDir(parent: UnfoldCell, child: UnfoldCell): EdgeDir | null {
  const dx = child.gridX - parent.gridX
  const dy = child.gridY - parent.gridY
  if (dx === 1 && dy === 0) return 'east'
  if (dx === -1 && dy === 0) return 'west'
  if (dx === 0 && dy === 1) return 'south'
  if (dx === 0 && dy === -1) return 'north'
  return null
}

export function buildHingeTree(layout: UnfoldLayout): HingeLink[] {
  const links = buildHingeTreeRaw(layout)
  resolveHingeSigns(layout, links)
  return links
}

/** @internal Used by tests to evaluate custom hinge signs. */
export function computeHingePosesWithLinks(
  layout: UnfoldLayout,
  links: HingeLink[],
  globalT: number,
): Record<FaceId, FacePose3D> {
  if (globalT <= 0) return computeFlatPoses(layout)
  return computeHingePosesInternal(layout, links, Math.min(1, globalT))
}

/** @internal Used by tests to evaluate custom hinge signs. */
export function buildHingeTreeRaw(layout: UnfoldLayout): HingeLink[] {
  const map = cellMap(layout)
  const root = layout.anchorFace
  const visited = new Set<FaceId>([root])
  const links: HingeLink[] = []
  const queue: FaceId[] = [root]

  while (queue.length > 0) {
    const parentId = queue.shift()!
    const parent = map.get(parentId)!
    for (const cell of layout.cells) {
      if (visited.has(cell.faceId)) continue
      const edge = neighborDir(parent, cell)
      if (!edge) continue
      visited.add(cell.faceId)
      queue.push(cell.faceId)
      links.push({ faceId: cell.faceId, parent: parentId, edge, sign: 1 })
    }
  }

  return links
}

/** All faces that move rigidly when pivotFace's hinge rotates (pivot + descendants). */
export function getSubPanelFaces(layout: UnfoldLayout, pivotFace: FaceId): FaceId[] {
  const links = getLinks(layout.id)
  const children = new Map<FaceId, FaceId[]>()
  for (const link of links) {
    const list = children.get(link.parent) ?? []
    list.push(link.faceId)
    children.set(link.parent, list)
  }

  const panel: FaceId[] = []
  const queue = [pivotFace]
  while (queue.length > 0) {
    const id = queue.shift()!
    panel.push(id)
    for (const child of children.get(id) ?? []) {
      queue.push(child)
    }
  }
  return panel
}

function hingePointVec(edge: EdgeDir): [number, number, number] {
  switch (edge) {
    case 'east':
      return [HALF, 0, 0]
    case 'west':
      return [-HALF, 0, 0]
    case 'north':
      return [0, HALF, 0]
    case 'south':
      return [0, -HALF, 0]
  }
}

function flatCenterVec(layout: UnfoldLayout, faceId: FaceId): [number, number, number] {
  const xs = layout.cells.map((c) => c.gridX)
  const ys = layout.cells.map((c) => c.gridY)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  const cell = cellMap(layout).get(faceId)!
  return [cell.gridX - cx, 0, cell.gridY - cy]
}

function hingePoint(edge: EdgeDir): THREE.Vector3 {
  const [x, y, z] = hingePointVec(edge)
  return new THREE.Vector3(x, y, z)
}

function flatCenter(layout: UnfoldLayout, faceId: FaceId): THREE.Vector3 {
  const [x, y, z] = flatCenterVec(layout, faceId)
  return new THREE.Vector3(x, y, z)
}

export function hingeAngle(link: HingeLink, layout: UnfoldLayout, globalT: number): number {
  const progress = hingeProgress(link.faceId, layout, globalT)
  return progress * (Math.PI / 2) * link.sign
}

export function hingeRotation(link: HingeLink, layout: UnfoldLayout, globalT: number): [number, number, number] {
  const angle = hingeAngle(link, layout, globalT)
  if (link.edge === 'east' || link.edge === 'west') {
    return [0, angle, 0]
  }
  return [angle, 0, 0]
}

export { hingePointVec, flatCenterVec, getLinks }

/** Explicit flat net — all faces on XZ plane, normals up. */
export function computeFlatPoses(layout: UnfoldLayout): Record<FaceId, FacePose3D> {
  return Object.fromEntries(
    layout.cells.map((cell) => {
      const pos = flatCenter(layout, cell.faceId)
      return [
        cell.faceId,
        {
          position: [pos.x, pos.y, pos.z],
          rotation: [-Math.PI / 2, 0, 0],
        },
      ]
    }),
  ) as Record<FaceId, FacePose3D>
}

/** Edge direction in the parent face's local space (hinge line direction). */
function hingeLocalAxis(edge: EdgeDir): THREE.Vector3 {
  return edge === 'east' || edge === 'west'
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0)
}

/** @internal Used by tests. */
export function faceWorldNormal(obj: THREE.Object3D): THREE.Vector3 {
  return new THREE.Vector3(0, 0, 1).applyQuaternion(obj.getWorldQuaternion(new THREE.Quaternion())).normalize()
}

/** @internal Used by tests. */
export function buildFaceScene(
  layout: UnfoldLayout,
  links: HingeLink[],
  globalT: number,
): { scene: THREE.Object3D; faceNodes: Record<FaceId, THREE.Object3D> } {
  const root = layout.anchorFace
  const linkByChild = new Map(links.map((l) => [l.faceId, l]))
  const faceNodes: Partial<Record<FaceId, THREE.Object3D>> = {}
  const scene = new THREE.Object3D()

  const rootFace = new THREE.Object3D()
  rootFace.position.copy(flatCenter(layout, root))
  rootFace.quaternion.copy(FLAT_QUAT)
  scene.add(rootFace)
  faceNodes[root] = rootFace

  const order: FaceId[] = [root]
  const queue = [root]
  while (queue.length > 0) {
    const pid = queue.shift()!
    for (const link of links) {
      if (link.parent === pid && !order.includes(link.faceId)) {
        order.push(link.faceId)
        queue.push(link.faceId)
      }
    }
  }

  for (const faceId of order) {
    if (faceId === root) continue
    const link = linkByChild.get(faceId)!
    const parentFace = faceNodes[link.parent]!

    const hinge = new THREE.Object3D()
    hinge.position.copy(hingePoint(link.edge))
    parentFace.add(hinge)

    const progress = hingeProgress(faceId, layout, globalT)
    const angle = progress * (Math.PI / 2) * link.sign
    scene.updateMatrixWorld(true)
    setHingeRotation(hinge, parentFace, link, angle, layout)

    const face = new THREE.Object3D()
    face.position.copy(hingePoint(link.edge))
    hinge.add(face)
    faceNodes[faceId] = face
  }

  scene.updateMatrixWorld(true)
  return { scene, faceNodes: faceNodes as Record<FaceId, THREE.Object3D> }
}

function oppositeEastWestPenalty(links: HingeLink[]): number {
  const byParent = new Map<FaceId, HingeLink[]>()
  for (const link of links) {
    if (link.edge !== 'west' && link.edge !== 'east') continue
    const list = byParent.get(link.parent) ?? []
    list.push(link)
    byParent.set(link.parent, list)
  }

  let penalty = 0
  for (const group of byParent.values()) {
    const west = group.find((link) => link.edge === 'west')
    const east = group.find((link) => link.edge === 'east')
    if (west && east && west.sign === east.sign) penalty += 20
  }
  return penalty
}

function anchorNorthSouthSignPenalty(links: HingeLink[], layout: UnfoldLayout): number {
  const anchor = layout.anchorFace
  const north = links.find((link) => link.parent === anchor && link.edge === 'north')
  const south = links.find((link) => link.parent === anchor && link.edge === 'south')
  let penalty = 0
  if (north && north.sign !== 1) penalty += 12
  if (south && south.sign !== 1) penalty += 12
  return penalty
}

function foldScore(layout: UnfoldLayout, links: HingeLink[]): number {
  let score = 0

  for (let stepIndex = 0; stepIndex < layout.foldSteps.length; stepIndex++) {
    const pivot = layout.foldSteps[stepIndex]!.pivotFace
    const t = (stepIndex + 1) / layout.foldSteps.length - 0.001
    const { faceNodes } = buildFaceScene(layout, links, t)
    const normal = faceWorldNormal(faceNodes[pivot])
    const target = CUBE_FACE_NORMALS[pivot]
    score += 2 * (1 - normal.dot(target))
    if (pivot === 'left' || pivot === 'right') {
      const y = faceNodes[pivot].getWorldPosition(new THREE.Vector3()).y
      score += y < 0 ? 8 : 0
    }
    if (pivot === 'back') {
      score += normal.dot(target) < 0.5 ? 8 : 0
    }
    if (pivot === 'bottom') {
      const y = faceNodes[pivot].getWorldPosition(new THREE.Vector3()).y
      score += y > 0 ? 8 : 0
    }
  }

  const { faceNodes } = buildFaceScene(layout, links, 1)
  for (const id of FACE_IDS) {
    const normal = faceWorldNormal(faceNodes[id])
    score += 1 - normal.dot(CUBE_FACE_NORMALS[id])
  }

  score += oppositeEastWestPenalty(links)
  score += anchorNorthSouthSignPenalty(links, layout)
  return score
}


function setHingeRotation(
  hinge: THREE.Object3D,
  parentFace: THREE.Object3D,
  link: HingeLink,
  angle: number,
  layout: UnfoldLayout,
) {
  if (Math.abs(angle) < 1e-9) return

  if (link.parent === layout.anchorFace) {
    hinge.quaternion.setFromAxisAngle(hingeLocalAxis(link.edge), angle)
    return
  }

  parentFace.updateMatrixWorld(true)
  const parentWorldQuat = parentFace.getWorldQuaternion(new THREE.Quaternion())
  const worldAxis = new THREE.Vector3(0, 1, 0)
  const qWorld = new THREE.Quaternion().setFromAxisAngle(worldAxis, angle)
  hinge.quaternion.copy(parentWorldQuat.clone().invert().multiply(qWorld).multiply(parentWorldQuat))
}

function resolveHingeSigns(layout: UnfoldLayout, links: HingeLink[]) {
  const n = links.length
  let bestScore = Infinity
  let bestSigns: number[] = links.map(() => 1)

  for (let mask = 0; mask < 1 << n; mask++) {
    for (let i = 0; i < n; i++) {
      links[i].sign = mask & (1 << i) ? -1 : 1
    }
    const score = foldScore(layout, links)
    if (score < bestScore) {
      bestScore = score
      bestSigns = links.map((link) => link.sign)
    }
  }

  for (let i = 0; i < n; i++) {
    links[i].sign = bestSigns[i]!
  }
}

function hingeProgress(faceId: FaceId, layout: UnfoldLayout, globalT: number): number {
  const root = layout.anchorFace
  if (faceId === root) return 0

  const stepIndex = layout.foldSteps.findIndex((step) => step.pivotFace === faceId)
  if (stepIndex < 0) return 0

  const totalSteps = layout.foldSteps.length
  const globalStep = globalT * totalSteps

  if (globalStep >= stepIndex + 1) return 1
  if (globalStep <= stepIndex) return 0
  return globalStep - stepIndex
}

function objectToPose(obj: THREE.Object3D): FacePose3D {
  const pos = new THREE.Vector3()
  const quat = new THREE.Quaternion()
  const scale = new THREE.Vector3()
  obj.matrixWorld.decompose(pos, quat, scale)
  const euler = new THREE.Euler().setFromQuaternion(quat)
  return { position: [pos.x, pos.y, pos.z], rotation: [euler.x, euler.y, euler.z] }
}

function computeHingePosesInternal(
  layout: UnfoldLayout,
  links: HingeLink[],
  globalT: number,
): Record<FaceId, FacePose3D> {
  const { faceNodes } = buildFaceScene(layout, links, globalT)
  return Object.fromEntries(
    FACE_IDS.map((id) => [id, objectToPose(faceNodes[id]!)]),
  ) as Record<FaceId, FacePose3D>
}

function blendPoses(
  from: Record<FaceId, FacePose3D>,
  to: Record<FaceId, FacePose3D>,
  alpha: number,
): Record<FaceId, FacePose3D> {
  const result = {} as Record<FaceId, FacePose3D>
  for (const id of FACE_IDS) {
    const a = from[id]
    const b = to[id]
    result[id] = {
      position: [
        a.position[0] + (b.position[0] - a.position[0]) * alpha,
        a.position[1] + (b.position[1] - a.position[1]) * alpha,
        a.position[2] + (b.position[2] - a.position[2]) * alpha,
      ],
      rotation: [
        a.rotation[0] + (b.rotation[0] - a.rotation[0]) * alpha,
        a.rotation[1] + (b.rotation[1] - a.rotation[1]) * alpha,
        a.rotation[2] + (b.rotation[2] - a.rotation[2]) * alpha,
      ],
    }
  }
  return result
}

const hingeCache = new Map<UnfoldType, HingeLink[]>()

function getLinks(unfoldType: UnfoldType): HingeLink[] {
  if (!hingeCache.has(unfoldType)) {
    hingeCache.set(unfoldType, buildHingeTree(UNFOLD_LAYOUTS[unfoldType - 1]))
  }
  return hingeCache.get(unfoldType)!
}

export function computeHingePoses(
  unfoldType: UnfoldType,
  globalT: number,
  options: FoldPoseOptions = {},
): Record<FaceId, FacePose3D> {
  const snapToCube = options.snapToCube ?? true
  const layout = UNFOLD_LAYOUTS[unfoldType - 1]
  if (globalT <= 0) return computeFlatPoses(layout)

  const links = getLinks(unfoldType)
  const t = Math.min(1, globalT)
  const raw = computeHingePosesInternal(layout, links, t)

  if (t >= 1) {
    return layout.cubePoses
  }

  if (snapToCube && t > ALIGN_START) {
    const alpha = (t - ALIGN_START) / (1 - ALIGN_START)
    return blendPoses(raw, layout.cubePoses, alpha)
  }

  return raw
}

export function computeUnfoldGrid3D(unfoldType: UnfoldType): Record<FaceId, FacePose3D> {
  return computeHingePoses(unfoldType, 0)
}
