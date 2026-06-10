import gsap from 'gsap'
import { computeHingePoses } from '@/animation/foldHierarchy'
import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'
import { useCubeStore } from '@/store/cubeStore'
import type { FacePose3D, UnfoldType } from '@/types/cube'

let activeTween: gsap.core.Tween | null = null

function killActiveTween() {
  activeTween?.kill()
  activeTween = null
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

export function computeFoldPoses(
  unfoldType: UnfoldType,
  foldProgress: number,
  snapToCube = true,
): Record<string, FacePose3D> {
  return computeHingePoses(unfoldType, foldProgress, { snapToCube })
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
  const clamped = Math.max(0, Math.min(stepIndex, layout.foldSteps.length))
  const target = clamped / layout.foldSteps.length
  tweenFoldProgress(target, 0.6, onComplete)
}

export function stopFoldAnimation() {
  killActiveTween()
}
