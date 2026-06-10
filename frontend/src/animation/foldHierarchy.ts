import * as THREE from 'three'
import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'
import type { FaceId, FacePose3D, UnfoldCell, UnfoldLayout, UnfoldType } from '@/types/cube'
import { FACE_IDS } from '@/types/cube'

const HALF = 0.5
const FLAT_QUAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
const ALIGN_START = 0.82

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

  resolveHingeSigns(layout, links)
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

function hingePoint(edge: EdgeDir): THREE.Vector3 {
  switch (edge) {
    case 'east':
      return new THREE.Vector3(HALF, 0, 0)
    case 'west':
      return new THREE.Vector3(-HALF, 0, 0)
    case 'south':
      return new THREE.Vector3(0, 0, HALF)
    case 'north':
      return new THREE.Vector3(0, 0, -HALF)
  }
}

function flatCenter(layout: UnfoldLayout, faceId: FaceId): THREE.Vector3 {
  const xs = layout.cells.map((c) => c.gridX)
  const ys = layout.cells.map((c) => c.gridY)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  const cell = cellMap(layout).get(faceId)!
  return new THREE.Vector3(cell.gridX - cx, 0, cell.gridY - cy)
}

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

function poseError(a: FacePose3D, b: FacePose3D): number {
  const posDist = Math.hypot(
    a.position[0] - b.position[0],
    a.position[1] - b.position[1],
    a.position[2] - b.position[2],
  )
  const rotDist =
    Math.abs(a.rotation[0] - b.rotation[0]) +
    Math.abs(a.rotation[1] - b.rotation[1]) +
    Math.abs(a.rotation[2] - b.rotation[2])
  return posDist + rotDist * 0.35
}

function resolveHingeSigns(layout: UnfoldLayout, links: HingeLink[]) {
  const target = layout.cubePoses
  for (const link of links) {
    let bestSign = 1
    let bestErr = Infinity
    for (const sign of [1, -1] as const) {
      link.sign = sign
      const poses = computeHingePosesInternal(layout, links, 1)
      let total = 0
      for (const id of FACE_IDS) total += poseError(poses[id], target[id])
      if (total < bestErr) {
        bestErr = total
        bestSign = sign
      }
    }
    link.sign = bestSign
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

/** Compute the world-space rotation axis for a hinge edge given the parent face's world quaternion. */
function hingeWorldAxis(parentWorldQuat: THREE.Quaternion, edge: EdgeDir): THREE.Vector3 {
  const localAxis =
    edge === 'east' || edge === 'west'
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0)
  return localAxis.applyQuaternion(parentWorldQuat).normalize()
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
    const parentWorldQuat = parentFace.getWorldQuaternion(new THREE.Quaternion())
    const worldAxis = hingeWorldAxis(parentWorldQuat, link.edge)
    const qWorld = new THREE.Quaternion().setFromAxisAngle(worldAxis, angle)
    hinge.quaternion.copy(parentWorldQuat.conjugate().multiply(qWorld))

    const face = new THREE.Object3D()
    face.position.copy(hingePoint(link.edge).clone().negate())

    hinge.add(face)
    faceNodes[faceId] = face
  }

  scene.updateMatrixWorld(true)

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
