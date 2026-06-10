import { useCallback, useRef, useState } from 'react'
import { EditorPanel } from '@/components/EditorPanel'
import type { EditorHistoryApi } from '@/editor/useFabricHistory'
import type { ShapeKey } from '@/editor/shapes'
import { PreviewPanel } from '@/components/PreviewPanel'
import { ToolBar } from '@/components/ToolBar'
import { TopBar } from '@/components/TopBar'

export function AppShell() {
  const historyRef = useRef<EditorHistoryApi | null>(null)
  const insertShapeRef = useRef<(key: ShapeKey) => void>(() => {})
  const [historyFlags, setHistoryFlags] = useState({ canUndo: false, canRedo: false })

  const handleHistoryReady = useCallback((api: EditorHistoryApi) => {
    historyRef.current = api
    setHistoryFlags({ canUndo: api.canUndo, canRedo: api.canRedo })
  }, [])

  const handleHistoryFlagsChange = useCallback(
    (flags: { canUndo: boolean; canRedo: boolean }) => {
      setHistoryFlags(flags)
    },
    [],
  )

  return (
    <div className="flex h-screen flex-col bg-[#f8fafc]">
      <TopBar />
      <main className="grid min-h-0 flex-1 grid-cols-[3fr_2fr] gap-4 p-4">
        <EditorPanel
          onHistoryReady={handleHistoryReady}
          onHistoryFlagsChange={handleHistoryFlagsChange}
          onRegisterInsertShape={(fn) => {
            insertShapeRef.current = fn
          }}
        />
        <PreviewPanel />
      </main>
      <ToolBar
        history={historyRef.current}
        canUndo={historyFlags.canUndo}
        canRedo={historyFlags.canRedo}
        onInsertShape={(key) => insertShapeRef.current(key)}
      />
    </div>
  )
}
