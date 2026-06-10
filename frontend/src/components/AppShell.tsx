import { EditorPanel } from '@/components/EditorPanel'
import { PreviewPanel } from '@/components/PreviewPanel'
import { ToolBar } from '@/components/ToolBar'
import { TopBar } from '@/components/TopBar'

export function AppShell() {
  return (
    <div className="flex h-screen flex-col bg-[#f8fafc]">
      <TopBar />
      <main className="grid min-h-0 flex-1 grid-cols-[3fr_2fr] gap-4 p-4">
        <EditorPanel />
        <PreviewPanel />
      </main>
      <ToolBar />
    </div>
  )
}
