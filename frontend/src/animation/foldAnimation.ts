import gsap from 'gsap'
import * as THREE from 'three'
import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'
import { useCubeStore } from '@/store/cubeStore'
import type { FaceId, FacePose3D, UnfoldType } from '@/types/cube'

const UNFOLD_SPACING = 1.1
const FLAT_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0]

const _eulerFrom = new THREE.Euler()
const _eulerTo = new THREE.Euler()
const _quatFrom = new THREE.Quaternion()
const _quatTo = new THREE.Quaternion()
const _quatOut = new THREE.Quaternion()
const _eulerOut = new THREE.Euler()

let activeTween: gsap.core.Tween | null = null

function killActiveTween() {
  activeTween?.kill()
  activeTween = null
}

export function computeUnfoldGrid3D(unfoldType: UnfoldType): Record<FaceId, FacePose3D> {
  const layout = UNFOLD_LAYOUTS[unfoldType - 1]
  const xs = layout.cells.map((c) => c.gridX)
  const ys = layout.cells.map((c) => c.gridY)
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2

  return Object.fromEntries(
    layout.cells.map((cell) => [
      cell.faceId,
      {
        position: [
          (cell.gridX - centerX) * UNFOLD_SPACING,
          0,
          (cell.gridY - centerY) * UNFOLD_SPACING,
        ] as [number, number, number],
        rotation: FLAT_ROTATION,
      },
    ]),
  ) as Record<FaceId, FacePose3D>
}

export function lerpPose(from: FacePose3D, to: FacePose3D, t: number): FacePose3D {
  const position: [number, number, number] = [
    from.position[0] + (to.position[0] - from.position[0]) * t,
    from.position[1] + (to.position[1] - from.position[1]) * t,
    from.position[2] + (to.position[2] - from.position[2]) * t,
  ]

  _eulerFrom.set(from.rotation[0], from.rotation[1], from.rotation[2])
  _eulerTo.set(to.rotation[0], to.rotation[1], to.rotation[2])
  _quatFrom.setFromEuler(_eulerFrom)
  _quatTo.setFromEuler(_eulerTo)
  _quatOut.slerpQuaternions(_quatFrom, _quatTo, t)
  _eulerOut.setFromQuaternion(_quatOut)

  return {
    position,
    rotation: [_eulerOut.x, _eulerOut.y, _eulerOut.z],
  }
}

function tweenFoldProgress(target: number, duration: number, onComplete?: () => void) {
  killActiveTween()
  const store = useCubeStore.getState()
  const proxy = { progress: store.foldProgress }
  activeTween = gsap.to(proxy, {
    progress: target,
    duration,
    ease: 'power2.inOut',
    onUpdate: () => store.setFoldProgress(proxy.progress),
    onComplete: () => {
      activeTween = null
      onComplete?.()
    },
  })
}

export function fastFold(onComplete?: () => void) {
  useCubeStore.getState().setMode('3d-view')
  tweenFoldProgress(1, 0.8, onComplete)
}

export function fastUnfold(onComplete?: () => void) {
  useCubeStore.getState().setMode('unfold-edit')
  tweenFoldProgress(0, 0.8, onComplete)
}

export function stepFold(stepIndex: number, onComplete?: () => void) {
  const { unfoldType } = useCubeStore.getState()
  const layout = UNFOLD_LAYOUTS[unfoldType - 1]
  const clamped = Math.max(0, Math.min(stepIndex, layout.foldSequence.length))
  const target = clamped / layout.foldSequence.length
  tweenFoldProgress(target, 0.6, onComplete)
}

export function stopFoldAnimation() {
  killActiveTween()
}
