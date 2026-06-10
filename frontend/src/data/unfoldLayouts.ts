import type { FaceId, FacePose3D, UnfoldCell, UnfoldLayout } from '@/types/cube'

const CUBE_POSES: Record<FaceId, FacePose3D> = {
  front: { position: [0, 0, 0.5], rotation: [0, 0, 0] },
  back: { position: [0, 0, -0.5], rotation: [0, Math.PI, 0] },
  left: { position: [-0.5, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  right: { position: [0.5, 0, 0], rotation: [0, Math.PI / 2, 0] },
  top: { position: [0, 0.5, 0], rotation: [-Math.PI / 2, 0, 0] },
  bottom: { position: [0, -0.5, 0], rotation: [Math.PI / 2, 0, 0] },
}

function cells(entries: [FaceId, number, number][]): UnfoldCell[] {
  return entries.map(([faceId, gridX, gridY]) => ({ faceId, gridX, gridY }))
}

function steps(faces: FaceId[]) {
  return faces.map((pivotFace) => ({ pivotFace }))
}

export const UNFOLD_LAYOUTS: UnfoldLayout[] = [
  {
    id: 1,
    name: 'T 型 1',
    cells: cells([
      ['top', 1, 0],
      ['front', 1, 1],
      ['left', 0, 1],
      ['right', 2, 1],
      ['back', 3, 1],
      ['bottom', 1, 2],
    ]),
    anchorFace: 'front',
    foldSteps: steps(['left', 'right', 'back', 'top', 'bottom']),
    cubePoses: CUBE_POSES,
  },
  {
    id: 2,
    name: '阶梯型',
    cells: cells([
      ['left', 0, 0],
      ['front', 1, 0],
      ['right', 2, 0],
      ['bottom', 2, 1],
      ['back', 3, 1],
      ['top', 4, 1],
    ]),
    anchorFace: 'front',
    foldSteps: steps(['left', 'right', 'bottom', 'back', 'top']),
    cubePoses: CUBE_POSES,
  },
  {
    id: 3,
    name: 'L 型 1',
    cells: cells([
      ['top', 0, 0],
      ['left', 0, 1],
      ['front', 1, 1],
      ['bottom', 1, 2],
      ['back', 1, 3],
      ['right', 2, 3],
    ]),
    anchorFace: 'front',
    foldSteps: steps(['left', 'top', 'bottom', 'back', 'right']),
    cubePoses: CUBE_POSES,
  },
  {
    id: 4,
    name: 'L 型 2',
    cells: cells([
      ['top', 1, 0],
      ['left', 0, 1],
      ['front', 1, 1],
      ['right', 2, 1],
      ['bottom', 2, 2],
      ['back', 3, 2],
    ]),
    anchorFace: 'front',
    foldSteps: steps(['left', 'right', 'bottom', 'back', 'top']),
    cubePoses: CUBE_POSES,
  },
  {
    id: 5,
    name: 'Z 型 1',
    cells: cells([
      ['left', 0, 0],
      ['top', 1, 0],
      ['front', 1, 1],
      ['right', 2, 1],
      ['bottom', 2, 2],
      ['back', 3, 2],
    ]),
    anchorFace: 'front',
    foldSteps: steps(['left', 'top', 'right', 'bottom', 'back']),
    cubePoses: CUBE_POSES,
  },
  {
    id: 6,
    name: '1×4 条型 1',
    cells: cells([
      ['left', 0, 0],
      ['top', 1, 0],
      ['front', 1, 1],
      ['right', 2, 1],
      ['back', 3, 1],
      ['bottom', 1, 2],
    ]),
    anchorFace: 'front',
    foldSteps: steps(['left', 'top', 'right', 'back', 'bottom']),
    cubePoses: CUBE_POSES,
  },
  {
    id: 7,
    name: '1×4 条型 2',
    cells: cells([
      ['top', 0, 0],
      ['left', 0, 1],
      ['front', 1, 1],
      ['right', 2, 1],
      ['back', 3, 1],
      ['bottom', 0, 2],
    ]),
    anchorFace: 'front',
    foldSteps: steps(['top', 'left', 'right', 'back', 'bottom']),
    cubePoses: CUBE_POSES,
  },
  {
    id: 8,
    name: 'T 型 2',
    cells: cells([
      ['top', 3, 0],
      ['left', 0, 1],
      ['front', 1, 1],
      ['right', 2, 1],
      ['back', 3, 1],
      ['bottom', 2, 2],
    ]),
    anchorFace: 'front',
    foldSteps: steps(['left', 'right', 'bottom', 'back', 'top']),
    cubePoses: CUBE_POSES,
  },
  {
    id: 9,
    name: '5×2 条型 1',
    cells: cells([
      ['top', 1, 0],
      ['front', 1, 1],
      ['right', 2, 1],
      ['bottom', 1, 2],
      ['left', 0, 3],
      ['back', 1, 3],
    ]),
    anchorFace: 'front',
    foldSteps: steps(['left', 'right', 'top', 'bottom', 'back']),
    cubePoses: CUBE_POSES,
  },
  {
    id: 10,
    name: '5×2 条型 2',
    cells: cells([
      ['top', 1, 0],
      ['right', 2, 0],
      ['front', 1, 1],
      ['bottom', 1, 2],
      ['left', 0, 3],
      ['back', 1, 3],
    ]),
    anchorFace: 'front',
    foldSteps: steps(['left', 'right', 'top', 'bottom', 'back']),
    cubePoses: CUBE_POSES,
  },
  {
    id: 11,
    name: 'Z 型 2',
    cells: cells([
      ['top', 1, 0],
      ['front', 1, 1],
      ['right', 2, 1],
      ['left', 0, 2],
      ['bottom', 1, 2],
      ['back', 1, 3],
    ]),
    anchorFace: 'front',
    foldSteps: steps(['left', 'right', 'bottom', 'back', 'top']),
    cubePoses: CUBE_POSES,
  },
]
