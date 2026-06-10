import { useEffect, useRef } from 'react'
import { StaticCanvas } from 'fabric'

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

    const canvas = new StaticCanvas(el, {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      backgroundColor: '#ffffff',
    })

    void canvas.loadFromJSON(fabricJson).then(() => {
      canvas.requestRenderAll()
    }).catch((err) => {
      console.error('[FaceThumbnail] loadFromJSON failed:', err)
    })

    return () => {
      canvas.dispose()
    }
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
