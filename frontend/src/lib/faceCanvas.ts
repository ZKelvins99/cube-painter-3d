export const FACE_SIZE = 512

export function createFaceCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = FACE_SIZE
  c.height = FACE_SIZE
  const ctx = c.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, FACE_SIZE, FACE_SIZE)
  }
  return c
}
