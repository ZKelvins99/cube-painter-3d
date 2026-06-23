/**
 * Cube fold hierarchy — physically-correct rigid-hinge folding.
 *
 * MODEL: "Vertical-direct net".
 *  - The flat net stands in a VERTICAL plane facing the camera (normal +Z).
 *  - The anchor face (always `front`) is pinned to its final canonical cube pose
 *    from t=0 onward: position [0,0,0.5], rotation identity (normal +Z). It never moves.
 *  - Every other face is a rigid panel hinged to its parent along their shared grid
 *    edge. Each hinge rotates exactly +/-90° about the real physical shared edge.
 *  - At t=1 the pure hinge geometry lands EXACTLY on `layout.cubePoses` — no snapping,
 *    no blending, no presentation transform. The fold is fully continuous.
 *
 * Sign resolution is ANALYTICAL (not brute-force): for each child the correct fold
 * direction is the unique +/-90° rotation about its world hinge axis whose resulting
 * face normal matches CUBE_FACE_NORMALS[child]. Computed in BFS order so each parent's
 * folded world quaternion is known before its children are resolved.
 *
 * Coordinate convention (vertical net):
 *  - gridX  -> world X   (left/right)
 *  - gridY  -> world -Y  (grid rows go DOWN, world Y goes UP)
 *  - flat plane lives at world Z = 0.5 (coincident with the front face plane)
 *  - all flat faces have rotation [0,0,0] (normal +Z, facing the camera)
 */

import * as THREE from 'three'
import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'
import type { FaceId, FacePose3D, UnfoldCell, UnfoldLayout, UnfoldType } from '@/types/cube'
import { FACE_IDS } from '@/types/cube'

const HALF = 0.5
const HALF_PI = Math.PI / 2

/** Target outward face normals once the net is fully folded into a cube (world space). */
const CUBE_FACE_NORMALS: Record<FaceId, THREE.Vector3> = {
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1),
  left: new THREE.Vector3(-1, 0, 0),
  right: new THREE.Vector3(1, 0, 0),
  top: new THREE.Vector3(0, 1, 0),
  bottom: new THREE.Vector3(0, -1, 0),
}

type EdgeDir = 'east' | 'west' | 'north' | 'south'

export type HingeLink = {
  faceId: FaceId
  parent: FaceId
  edge: EdgeDir
  sign: number
}

// ---------------------------------------------------------------------------
// Grid helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Hinge tree (BFS spanning tree rooted at the anchor face)
// ---------------------------------------------------------------------------

export function buildHingeTree(layout: UnfoldLayout): HingeLink[] {
  const links = buildHingeTreeRaw(layout)
  resolveHingeSignsAnalytical(layout, links)
  return links
}

/** @internal Raw BFS tree with signs left at the default (+1). Used by tests. */
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

  // links are emitted in BFS order (each parent before its children), which is exactly
  // the topological order the analytical sign resolver needs.
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

// ---------------------------------------------------------------------------
// Geometry helpers (local face space — every face is a 1x1 quad in local XY)
// ---------------------------------------------------------------------------

/** Hinge-point offset of an edge midpoint from the parent face center (local space). */
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

/**
 * Tangent direction of the shared edge in the parent's LOCAL space. For these
 * axis-aligned grid edges the edge tangent IS the rotation axis (a panel folds by
 * rotating about the line of its shared edge): east/west edges run along local Y,
 * north/south edges run along local X.
 */
function hingeLocalAxis(edge: EdgeDir): THREE.Vector3 {
  return edge === 'east' || edge === 'west'
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0)
}

function hingePoint(edge: EdgeDir): THREE.Vector3 {
  const [x, y, z] = hingePointVec(edge)
  return new THREE.Vector3(x, y, z)
}

/**
 * Flat position of a face in the vertical net, expressed relative to the anchor face's
 * grid cell so the anchor lands exactly on the front cube plane ([0,0,0.5]).
 *  gridX -> world X,  gridY -> world -Y (rows go down, world Y goes up),  Z = 0.5.
 */
function flatCenterVec(layout: UnfoldLayout, faceId: FaceId): [number, number, number] {
  const map = cellMap(layout)
  const anchor = map.get(layout.anchorFace)!
  const cell = map.get(faceId)!
  return [cell.gridX - anchor.gridX, anchor.gridY - cell.gridY, HALF]
}

function flatCenter(layout: UnfoldLayout, faceId: FaceId): THREE.Vector3 {
  const [x, y, z] = flatCenterVec(layout, faceId)
  return new THREE.Vector3(x, y, z)
}

// ---------------------------------------------------------------------------
// Per-hinge progress (linear staircase: each face folds 0->1 within its fold-step slot)
// ---------------------------------------------------------------------------

function hingeProgress(faceId: FaceId, layout: UnfoldLayout, globalT: number): number {
  const root = layout.anchorFace
  if (faceId === root) return 0

  const stepIndex = layout.foldSteps.findIndex((step) => step.pivotFace === faceId)
  if (stepIndex < 0) return 0

  const totalSteps = layout.foldSteps.length
  const globalStep = globalT * totalSteps

  if (globalStep >= stepIndex + 1) return 1
  if (globalStep <= stepIndex) return 0
  // smoothstep easing within each step — zero velocity at step boundaries
  const linear = globalStep - stepIndex
  return linear * linear * (3 - 2 * linear)
}

export function hingeAngle(link: HingeLink, layout: UnfoldLayout, globalT: number): number {
  const progress = hingeProgress(link.faceId, layout, globalT)
  return progress * HALF_PI * link.sign
}

/** @internal Legacy Euler-approximation helper (debug only; ignores nested parenting). */
export function hingeRotation(link: HingeLink, layout: UnfoldLayout, globalT: number): [number, number, number] {
  const angle = hingeAngle(link, layout, globalT)
  if (link.edge === 'east' || link.edge === 'west') {
    return [0, angle, 0]
  }
  return [angle, 0, 0]
}

// ---------------------------------------------------------------------------
// Analytical sign resolution — the physically-correct fold direction
// ---------------------------------------------------------------------------

/**
 * Resolve each hinge's sign analytically. For every child there are exactly two ways
 * to fold 90° about its world hinge axis (+90° or -90°); only one makes the child's
 * outward normal reach CUBE_FACE_NORMALS[child]. We pick that one.
 *
 * Folded world quaternion of each face is accumulated in BFS order:
 *   qChildWorld = qWorldFold · qParentWorld
 * where qWorldFold = rotation about the (parent-folded) world hinge axis by sign·90°.
 * For the anchor, qWorld = identity (it is pinned to the canonical front pose).
 */
function resolveHingeSignsAnalytical(layout: UnfoldLayout, links: HingeLink[]) {
  const qByFace = new Map<FaceId, THREE.Quaternion>()
  qByFace.set(layout.anchorFace, new THREE.Quaternion()) // identity

  const localAxis = new THREE.Vector3()
  const worldAxis = new THREE.Vector3()
  const childNormal = new THREE.Vector3()
  const qWorld = new THREE.Quaternion()
  const qChildWorld = new THREE.Quaternion()

  for (const link of links) {
    const qParentWorld = qByFace.get(link.parent)!
    localAxis.copy(hingeLocalAxis(link.edge))
    // The world hinge axis is the parent's local edge tangent expressed in world space.
    worldAxis.copy(localAxis).applyQuaternion(qParentWorld)

    let bestSign = 1
    let bestDot = -Infinity
    let bestChildWorld = new THREE.Quaternion()

    for (const sign of [1, -1]) {
      qWorld.setFromAxisAngle(worldAxis, sign * HALF_PI)
      qChildWorld.copy(qWorld).multiply(qParentWorld)
      childNormal.set(0, 0, 1).applyQuaternion(qChildWorld)
      const dot = childNormal.dot(CUBE_FACE_NORMALS[link.faceId])
      if (dot > bestDot) {
        bestDot = dot
        bestSign = sign
        bestChildWorld = qChildWorld.clone()
      }
    }

    link.sign = bestSign
    qByFace.set(link.faceId, bestChildWorld)
  }
}

// ---------------------------------------------------------------------------
// Scene graph (THREE.Object3D tree consumed by the renderer via objectToPose)
// ---------------------------------------------------------------------------

/** @internal Used by tests. Outward world normal of a face node (local +Z rotated). */
export function faceWorldNormal(obj: THREE.Object3D): THREE.Vector3 {
  return new THREE.Vector3(0, 0, 1).applyQuaternion(obj.getWorldQuaternion(new THREE.Quaternion())).normalize()
}

/**
 * Set a hinge's LOCAL quaternion so that, in world space, the child subtree rotates by
 * `angle` about the REAL physical shared edge (the parent's edge tangent in world space).
 *
 * By the quaternion conjugation property, rotating about the world hinge axis is
 * equivalent to rotating about the local axis by the same angle:
 *   qWorld   = rotation about worldHingeAxis by `angle`
 *   qHinge   = qParentWorld⁻¹ · qWorld · qParentWorld = R(localAxis, angle)
 *
 * So we can directly set the local rotation about the local hinge axis — no world
 * matrix updates or quaternion conjugation needed.
 */
function setHingeRotation(
  hinge: THREE.Object3D,
  link: HingeLink,
  angle: number,
) {
  if (Math.abs(angle) < 1e-9) {
    hinge.quaternion.identity()
    return
  }
  hinge.quaternion.setFromAxisAngle(hingeLocalAxis(link.edge), angle)
}

/** @internal Used by tests. Builds the THREE scene graph for a given fold progress. */
export function buildFaceScene(
  layout: UnfoldLayout,
  links: HingeLink[],
  globalT: number,
): { scene: THREE.Object3D; faceNodes: Record<FaceId, THREE.Object3D> } {
  const root = layout.anchorFace
  const linkByChild = new Map(links.map((l) => [l.faceId, l]))
  const faceNodes: Partial<Record<FaceId, THREE.Object3D>> = {}
  const scene = new THREE.Object3D()

  // Anchor: pinned to the canonical front pose (position [0,0,0.5], identity rotation).
  const rootFace = new THREE.Object3D()
  rootFace.position.copy(flatCenter(layout, root))
  rootFace.quaternion.identity()
  scene.add(rootFace)
  faceNodes[root] = rootFace

  // BFS traversal order (parents before children).
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

    // Hinge node sits at the shared edge midpoint (parent local space).
    const hinge = new THREE.Object3D()
    hinge.position.copy(hingePoint(link.edge))
    parentFace.add(hinge)

    const progress = hingeProgress(faceId, layout, globalT)
    const angle = progress * HALF_PI * link.sign
    setHingeRotation(hinge, link, angle)

    // Face node sits on the far side of the hinge (one cell away from the parent center).
    const face = new THREE.Object3D()
    face.position.copy(hingePoint(link.edge))
    hinge.add(face)
    faceNodes[faceId] = face
  }

  scene.updateMatrixWorld(true)
  return { scene, faceNodes: faceNodes as Record<FaceId, THREE.Object3D> }
}

// ---------------------------------------------------------------------------
// Pose extraction
// ---------------------------------------------------------------------------

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

/** Explicit flat net — vertical plane at Z=0.5, all faces facing +Z (camera). */
export function computeFlatPoses(layout: UnfoldLayout): Record<FaceId, FacePose3D> {
  return Object.fromEntries(
    layout.cells.map((cell) => {
      const pos = flatCenter(layout, cell.faceId)
      return [
        cell.faceId,
        {
          position: [pos.x, pos.y, pos.z],
          rotation: [0, 0, 0],
        },
      ]
    }),
  ) as Record<FaceId, FacePose3D>
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

// ---------------------------------------------------------------------------
// Cache + public entry
// ---------------------------------------------------------------------------

const hingeCache = new Map<UnfoldType, HingeLink[]>()

function getLinks(unfoldType: UnfoldType): HingeLink[] {
  if (!hingeCache.has(unfoldType)) {
    hingeCache.set(unfoldType, buildHingeTree(UNFOLD_LAYOUTS[unfoldType - 1]))
  }
  return hingeCache.get(unfoldType)!
}

/**
 * Main entry. Returns each face's {position, rotation} for a fold progress in [0,1].
 *
 *  - globalT <= 0 : vertical flat net (anchor pinned to front cube pose).
 *  - 0 < t < 1    : pure rigid-hinge geometry, sequential per foldStep.
 *  - t >= 1       : pure hinge geometry lands EXACTLY on layout.cubePoses (no snap/blend).
 */
export function computeHingePoses(
  unfoldType: UnfoldType,
  globalT: number,
): Record<FaceId, FacePose3D> {
  const layout = UNFOLD_LAYOUTS[unfoldType - 1]
  if (globalT <= 0) return computeFlatPoses(layout)

  const links = getLinks(unfoldType)
  const t = Math.min(1, globalT)
  return computeHingePosesInternal(layout, links, t)
}

/** Flat 3D grid poses for the editor's unfold view. */
export function computeUnfoldGrid3D(unfoldType: UnfoldType): Record<FaceId, FacePose3D> {
  return computeHingePoses(unfoldType, 0)
}

export { hingePointVec, flatCenterVec, getLinks }
