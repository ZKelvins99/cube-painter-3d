import { CubeScene } from '@/scene/CubeScene'

export function PreviewPanel() {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">3D 预览区</p>
      <div className="mt-4 h-full min-h-[400px] flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
        <CubeScene />
      </div>
    </div>
  )
}
