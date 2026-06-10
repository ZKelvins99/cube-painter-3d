import { AppShell } from '@/components/AppShell'
import { WebGLGuard } from '@/components/WebGLGuard'

export default function App() {
  return (
    <WebGLGuard>
      <AppShell />
    </WebGLGuard>
  )
}
