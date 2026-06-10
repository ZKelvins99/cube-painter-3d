import { useEffect, useRef } from 'react'
import { renderFabricJsonToCanvas } from '@/lib/renderFabricToCanvas'

const THUMB_SIZE = 48

interface FaceThumbnailProps {
  fabricJson: object
  label: string
}

export function FaceThumbnail({ fabricJson, label }: FaceThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    void renderFabricJsonToCanvas(fabricJson, el, THUMB_SIZE).catch((err) => {
      console.error('[FaceThumbnail] render failed:', err)
    })
  }, [fabricJson])

  return (
    <canvas
      ref={canvasRef}
      width={THUMB_SIZE}
      height={THUMB_SIZE}
      aria-label={label}
      className="h-full w-full rounded-md"
    />
  )
}
