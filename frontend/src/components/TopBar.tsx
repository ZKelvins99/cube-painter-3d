import { useState } from 'react'
import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'
import { useCubeStore } from '@/store/cubeStore'
import {
  listProjects,
  loadProject as loadProjectFromDb,
  saveProject,
} from '@/storage/projects'
import type { AppMode, CubeProject, UnfoldType } from '@/types/cube'

const DEFAULT_PROJECT_NAME = '未命名练习'

const MODES: { id: AppMode; label: string }[] = [
  { id: 'unfold-edit', label: '展开编辑' },
  { id: '3d-view', label: '3D观察' },
  { id: 'step-fold', label: '分步折叠' },
]

function showError(message: string) {
  alert(message)
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TopBar() {
  const mode = useCubeStore((s) => s.mode)
  const unfoldType = useCubeStore((s) => s.unfoldType)
  const project = useCubeStore((s) => s.project)
  const setMode = useCubeStore((s) => s.setMode)
  const setUnfoldType = useCubeStore((s) => s.setUnfoldType)
  const loadProject = useCubeStore((s) => s.loadProject)
  const newProject = useCubeStore((s) => s.newProject)

  const [openDialogVisible, setOpenDialogVisible] = useState(false)
  const [savedProjects, setSavedProjects] = useState<CubeProject[]>([])

  const handleSave = async () => {
    try {
      let name = project.name
      if (name === DEFAULT_PROJECT_NAME || name.startsWith('未命名')) {
        const input = window.prompt('请输入项目名称', name === DEFAULT_PROJECT_NAME ? '' : name)
        if (input === null) return
        const trimmed = input.trim()
        if (!trimmed) {
          showError('项目名称不能为空')
          return
        }
        name = trimmed
      }

      const toSave: CubeProject = {
        ...project,
        name,
        unfoldType,
        updatedAt: Date.now(),
      }
      await saveProject(toSave)
      loadProject(toSave)
    } catch (err) {
      console.error(err)
      showError('保存失败，请重试')
    }
  }

  const handleNew = () => {
    newProject()
  }

  const handleOpen = async () => {
    try {
      const list = await listProjects()
      setSavedProjects(list)
      setOpenDialogVisible(true)
    } catch (err) {
      console.error(err)
      showError('无法读取已保存的项目')
    }
  }

  const handleSelectProject = async (id: string) => {
    try {
      const loaded = await loadProjectFromDb(id)
      if (!loaded) {
        showError('项目不存在或已被删除')
        return
      }
      loadProject(loaded)
      setOpenDialogVisible(false)
    } catch (err) {
      console.error(err)
      showError('打开项目失败')
    }
  }

  const actionHandlers: Record<string, () => void> = {
    保存: () => void handleSave(),
    新建: handleNew,
    打开: () => void handleOpen(),
  }

  const actions = ['示例题', '保存', '新建', '打开'] as const

  return (
    <>
      <header className="flex shrink-0 flex-col gap-2 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800">Cube Painter 3D</h1>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span className="sr-only">展开图类型</span>
              <span aria-hidden>展开图</span>
              <select
                value={unfoldType}
                onChange={(e) => setUnfoldType(Number(e.target.value) as UnfoldType)}
                className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 transition-colors hover:border-[#3B82F6] focus:border-[#3B82F6] focus:outline-none"
              >
                {UNFOLD_LAYOUTS.map((layout) => (
                  <option key={layout.id} value={layout.id}>
                    {layout.id}. {layout.name}
                  </option>
                ))}
              </select>
            </label>
            {actions.map((label) => (
              <button
                key={label}
                type="button"
                onClick={actionHandlers[label]}
                disabled={label === '示例题'}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors hover:border-[#3B82F6] hover:text-[#3B82F6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <div
            className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5"
            role="tablist"
            aria-label="编辑模式"
          >
            {MODES.map(({ id, label }) => {
              const isActive = mode === id
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setMode(id)}
                  className={[
                    'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white text-[#3B82F6] shadow-sm'
                      : 'text-slate-600 hover:text-slate-800',
                  ].join(' ')}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {openDialogVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="open-project-title"
          onClick={() => setOpenDialogVisible(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="open-project-title" className="text-base font-semibold text-slate-800">
                打开项目
              </h2>
              <button
                type="button"
                onClick={() => setOpenDialogVisible(false)}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                关闭
              </button>
            </div>
            {savedProjects.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">暂无已保存的项目</p>
            ) : (
              <ul className="max-h-80 space-y-1 overflow-y-auto">
                {savedProjects.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => void handleSelectProject(item.id)}
                      className={[
                        'flex w-full flex-col rounded-xl border px-3 py-2.5 text-left transition-colors',
                        item.id === project.id
                          ? 'border-[#3B82F6] bg-blue-50'
                          : 'border-slate-200 hover:border-[#3B82F6] hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <span className="text-sm font-medium text-slate-800">{item.name}</span>
                      <span className="mt-0.5 text-xs text-slate-500">
                        展开图 {item.unfoldType} · 更新于 {formatDate(item.updatedAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  )
}
