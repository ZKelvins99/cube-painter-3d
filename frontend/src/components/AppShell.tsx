import { useCallback, useRef, useState } from 'react'
import { EditorPanel } from '@/components/EditorPanel'
import type { EditorHistoryApi } from '@/editor/useFabricHistory'
import type { ShapeKey } from '@/editor/shapes'
import { PreviewPanel } from '@/components/PreviewPanel'
import { ToolBar } from '@/components/ToolBar'
import { TopBar } from '@/components/TopBar'

export function AppShell() {
  const [history, setHistory] = useState<EditorHistoryApi | null>(null)
  const insertShapeRef = useRef<(key: ShapeKey) => void>(() => {})
  const handleHistoryReady = useCallback((api: EditorHistoryApi) => {
    setHistory(api)
  }, [])

  return (
    <div className="flex h-screen flex-col bg-[#f8fafc]">
      <TopBar />
      <main className="grid min-h-0 flex-1 grid-cols-[3fr_2fr] gap-4 p-4">
        <EditorPanel
          onHistoryReady={handleHistoryReady}
          onRegisterInsertShape={(fn) => {
            insertShapeRef.current = fn
          }}
        />
        <PreviewPanel />
      </main>
      <ToolBar
        history={history}
        onInsertShape={(key) => insertShapeRef.current(key)}
      />
    </div>
  )
}
