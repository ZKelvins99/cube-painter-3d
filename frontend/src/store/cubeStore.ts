import { create } from 'zustand'
import { stopFoldAnimation } from '@/animation/foldAnimation'
import type { AppMode, CubeProject, EditorTool, FaceId, UnfoldType } from '@/types/cube'
import { FACE_IDS } from '@/types/cube'
import { emptyFabricJson } from '@/lib/emptyFaceJson'

interface CubeState {
  mode: AppMode
  unfoldType: UnfoldType
  activeFace: FaceId
  tool: EditorTool
  project: CubeProject
  stepFoldIndex: number
  foldProgress: number
  hoveredFace3d: FaceId | null
  faceTextureVersion: number
  setMode: (m: AppMode) => void
  setUnfoldType: (t: UnfoldType) => void
  setActiveFace: (f: FaceId) => void
  setTool: (t: EditorTool) => void
  updateFaceJson: (faceId: FaceId, json: object) => void
  loadProject: (p: CubeProject) => void
  newProject: (name?: string) => void
  setStepFoldIndex: (i: number) => void
  setFoldProgress: (p: number) => void
  setHoveredFace3d: (f: FaceId | null) => void
  bumpFaceTextures: () => void
}

function createEmptyProject(name = '未命名练习'): CubeProject {
  const now = Date.now()
  const faces = Object.fromEntries(
    FACE_IDS.map((id) => [id, { faceId: id, fabricJson: emptyFabricJson() }])
  ) as CubeProject['faces']
  return { id: crypto.randomUUID(), name, createdAt: now, updatedAt: now, unfoldType: 1, faces }
}

export const useCubeStore = create<CubeState>((set) => ({
  mode: 'unfold-edit',
  unfoldType: 1,
  activeFace: 'front',
  tool: 'line',
  project: createEmptyProject(),
  stepFoldIndex: 0,
  foldProgress: 0,
  hoveredFace3d: null,
  faceTextureVersion: 0,
  setMode: (mode) => set({ mode }),
  setUnfoldType: (unfoldType) => {
    stopFoldAnimation()
    set({ unfoldType, foldProgress: 0, stepFoldIndex: 0 })
  },
  setActiveFace: (activeFace) => set({ activeFace }),
  setTool: (tool) => set({ tool }),
  updateFaceJson: (faceId, fabricJson) =>
    set((s) => ({
      project: {
        ...s.project,
        updatedAt: Date.now(),
        faces: { ...s.project.faces, [faceId]: { faceId, fabricJson } },
      },
    })),
  loadProject: (project) => {
    stopFoldAnimation()
    set({
      project,
      unfoldType: project.unfoldType,
      activeFace: 'front',
      mode: 'unfold-edit',
      stepFoldIndex: 0,
      foldProgress: 0,
    })
  },
  newProject: (name) =>
    set({ project: createEmptyProject(name), stepFoldIndex: 0, foldProgress: 0 }),
  setStepFoldIndex: (stepFoldIndex) => set({ stepFoldIndex }),
  setFoldProgress: (foldProgress) => set({ foldProgress }),
  setHoveredFace3d: (hoveredFace3d) => set({ hoveredFace3d }),
  bumpFaceTextures: () =>
    set((s) => ({ faceTextureVersion: s.faceTextureVersion + 1 })),
}))
