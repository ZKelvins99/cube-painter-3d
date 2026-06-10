export const FACE_SIZE = 512

export function createFaceCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = FACE_SIZE
  c.height = FACE_SIZE
  return c
}
