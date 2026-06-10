export type FaceId = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'

export const FACE_IDS: FaceId[] = ['front', 'back', 'left', 'right', 'top', 'bottom']

export type UnfoldType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

export type AppMode = 'unfold-edit' | '3d-view' | 'step-fold'

export type EditorTool = 'select' | 'line' | 'polyline' | 'eraser' | 'shape'

export interface FaceCanvasData {
  faceId: FaceId
  fabricJson: object
}

export interface CubeProject {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  unfoldType: UnfoldType
  faces: Record<FaceId, FaceCanvasData>
}

export interface UnfoldCell {
  faceId: FaceId
  gridX: number
  gridY: number
}

export interface FacePose3D {
  position: [number, number, number]
  rotation: [number, number, number]
}

export interface UnfoldLayout {
  id: UnfoldType
  name: string
  cells: UnfoldCell[]
  foldSequence: FaceId[][]
  cubePoses: Record<FaceId, FacePose3D>
}

export interface SampleQuestion {
  id: string
  title: string
  description: string
  unfoldType: UnfoldType
  faces: Record<FaceId, object>
  readOnly: boolean
}
