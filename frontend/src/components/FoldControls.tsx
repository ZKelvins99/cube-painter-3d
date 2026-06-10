import { fastFold, fastUnfold, stepFold } from '@/animation/foldAnimation'
import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'
import { useCubeStore } from '@/store/cubeStore'

export function FoldControls() {
  const mode = useCubeStore((s) => s.mode)
  const unfoldType = useCubeStore((s) => s.unfoldType)
  const stepFoldIndex = useCubeStore((s) => s.stepFoldIndex)
  const setMode = useCubeStore((s) => s.setMode)
  const setStepFoldIndex = useCubeStore((s) => s.setStepFoldIndex)

  const stepCount = UNFOLD_LAYOUTS[unfoldType - 1].foldSequence.length

  const handleStepFoldMode = () => {
    setMode('step-fold')
    const startIndex = Math.round(useCubeStore.getState().foldProgress * stepCount)
    setStepFoldIndex(startIndex)
    stepFold(startIndex)
  }

  const handlePrevStep = () => {
    const next = Math.max(0, stepFoldIndex - 1)
    setStepFoldIndex(next)
    stepFold(next)
  }

  const handleNextStep = () => {
    const next = Math.min(stepCount, stepFoldIndex + 1)
    setStepFoldIndex(next)
    stepFold(next)
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fastFold()}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors hover:border-[#3B82F6] hover:text-[#3B82F6]"
        >
          快速折叠
        </button>
        <button
          type="button"
          onClick={() => fastUnfold()}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors hover:border-[#3B82F6] hover:text-[#3B82F6]"
        >
          展开
        </button>
        <button
          type="button"
          onClick={handleStepFoldMode}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors hover:border-[#F97316] hover:text-[#F97316]"
        >
          分步折叠
        </button>
      </div>

      {mode === 'step-fold' && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="text-sm text-slate-600">
            步骤 {stepFoldIndex} / {stepCount}
          </span>
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={stepFoldIndex <= 0}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-sm text-slate-700 transition-colors hover:border-[#3B82F6] hover:text-[#3B82F6] disabled:cursor-not-allowed disabled:opacity-40"
          >
            上一步
          </button>
          <button
            type="button"
            onClick={handleNextStep}
            disabled={stepFoldIndex >= stepCount}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-sm text-slate-700 transition-colors hover:border-[#3B82F6] hover:text-[#3B82F6] disabled:cursor-not-allowed disabled:opacity-40"
          >
            下一步
          </button>
        </div>
      )}
    </div>
  )
}
