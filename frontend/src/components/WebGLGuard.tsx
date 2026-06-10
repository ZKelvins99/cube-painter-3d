import { useState, type ReactNode } from 'react'

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl')
    )
  } catch {
    return false
  }
}

export function WebGLGuard({ children }: { children: ReactNode }) {
  const [supported] = useState(() => hasWebGL())

  if (!supported) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] px-6 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-xl font-semibold text-slate-800">无法启动 3D 预览</h1>
          <p className="text-slate-600 leading-relaxed">
            您的浏览器未启用 WebGL，无法显示立方体 3D 预览。
            请使用最新版 Chrome 或 Edge，并确认浏览器设置中已开启硬件加速。
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
