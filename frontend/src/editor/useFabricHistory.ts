import { useCallback, useEffect, useRef, useState } from 'react'
import type { Canvas } from 'fabric'

const MAX_STEPS = 50
const DEBOUNCE_MS = 300

function snapshotKey(json: object) {
  return JSON.stringify(json)
}

interface UseFabricHistoryOptions {
  onAfterRestore?: () => void
}

export function useFabricHistory(canvas: Canvas | null, options?: UseFabricHistoryOptions) {
  const snapshotsRef = useRef<object[]>([])
  const indexRef = useRef(0)
  const isRestoringRef = useRef(false)
  const onAfterRestoreRef = useRef(options?.onAfterRestore)
  onAfterRestoreRef.current = options?.onAfterRestore
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const syncFlags = useCallback(() => {
    setCanUndo(indexRef.current > 0)
    setCanRedo(indexRef.current < snapshotsRef.current.length - 1)
  }, [])

  const pushSnapshot = useCallback(() => {
    if (!canvas || isRestoringRef.current) return

    const json = canvas.toObject()
    const key = snapshotKey(json)
    const current = snapshotsRef.current[indexRef.current]
    if (current && snapshotKey(current) === key) return

    const next = snapshotsRef.current.slice(0, indexRef.current + 1)
    next.push(json)
    if (next.length > MAX_STEPS) {
      next.shift()
      indexRef.current = next.length - 1
    } else {
      indexRef.current = next.length - 1
    }
    snapshotsRef.current = next
    syncFlags()
  }, [canvas, syncFlags])

  const schedulePush = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(pushSnapshot, DEBOUNCE_MS)
  }, [pushSnapshot])

  const restore = useCallback(
    async (json: object) => {
      if (!canvas) return
      isRestoringRef.current = true
      await canvas.loadFromJSON(json)
      canvas.requestRenderAll()
      isRestoringRef.current = false
      onAfterRestoreRef.current?.()
    },
    [canvas],
  )

  const reset = useCallback(() => {
    if (!canvas) return
    snapshotsRef.current = [canvas.toObject()]
    indexRef.current = 0
    syncFlags()
  }, [canvas, syncFlags])

  const undo = useCallback(() => {
    if (!canvas || indexRef.current <= 0) return
    indexRef.current -= 1
    void restore(snapshotsRef.current[indexRef.current]).then(syncFlags)
  }, [canvas, restore, syncFlags])

  const redo = useCallback(() => {
    if (!canvas || indexRef.current >= snapshotsRef.current.length - 1) return
    indexRef.current += 1
    void restore(snapshotsRef.current[indexRef.current]).then(syncFlags)
  }, [canvas, restore, syncFlags])

  useEffect(() => {
    if (!canvas) return

    reset()

    const onChange = () => schedulePush()
    canvas.on('object:added', onChange)
    canvas.on('object:modified', onChange)
    canvas.on('object:removed', onChange)

    return () => {
      canvas.off('object:added', onChange)
      canvas.off('object:modified', onChange)
      canvas.off('object:removed', onChange)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [canvas, reset, schedulePush])

  return { undo, redo, canUndo, canRedo, reset, isRestoringRef }
}

export type EditorHistoryApi = ReturnType<typeof useFabricHistory>
