# Cube Painter 3D — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a PC-first frontend MVP for 行测 cube visualization: 6-face line editor, 11 nets, 3D sync, fold animations, 3 sample questions, local save.

**Architecture:** React dual-panel app. Fabric.js owns per-face 2D vector data. R3F renders a cube with CanvasTexture per face. Zustand is the single source of truth. GSAP animates unfold ↔ cube poses defined in static layout data.

**Tech Stack:** React 18, Vite, TypeScript, Fabric.js, React Three Fiber, GSAP, Zustand, Tailwind, shadcn/ui, idb

**Spec:** [`docs/superpowers/specs/2026-06-10-cube-painter-design.md`](../specs/2026-06-10-cube-painter-design.md)

---

## File Map (created in this plan)

| Path | Responsibility |
|------|----------------|
| `frontend/src/types/cube.ts` | FaceId, CubeProject, UnfoldLayout, tools enums |
| `frontend/src/data/unfoldLayouts.ts` | 11 nets: grid cells + 3D poses + foldSequence |
| `frontend/src/data/sampleQuestions/` | 3 bundled JSON fixtures |
| `frontend/src/store/cubeStore.ts` | Zustand: faces, mode, tool, unfoldType, history flags |
| `frontend/src/storage/projects.ts` | IndexedDB CRUD via idb |
| `frontend/src/editor/FabricFaceCanvas.tsx` | One Fabric canvas instance |
| `frontend/src/editor/tools/` | line, polyline, eraser, shapes |
| `frontend/src/editor/useFabricHistory.ts` | undo/redo stack |
| `frontend/src/scene/CubeScene.tsx` | R3F Canvas + OrbitControls |
| `frontend/src/scene/CubeMesh.tsx` | 6 textured planes |
| `frontend/src/scene/useFaceTextures.ts` | Canvas → CanvasTexture map |
| `frontend/src/animation/foldAnimation.ts` | GSAP fast + step fold |
| `frontend/src/components/` | AppShell, TopBar, ToolBar, UnfoldGrid, StepFoldBar |
| `frontend/src/lib/faceCanvas.ts` | 512×512 offscreen canvas per face |

---

## Task 1: Frontend Scaffold

**Files:**
- Create: `frontend/` via Vite template
- Create: `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`

- [ ] **Step 1: Create Vite React TS project**

Run from repo root:

```bash
pnpm create vite frontend --template react-ts
cd frontend
pnpm install
```

- [ ] **Step 2: Install runtime dependencies**

```bash
pnpm add fabric@6 @react-three/fiber @react-three/drei three gsap zustand idb clsx tailwind-merge class-variance-authority lucide-react
pnpm add -D tailwindcss @tailwindcss/vite @types/three
```

- [ ] **Step 3: Configure Tailwind in `frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 4: Add `frontend/src/index.css`**

```css
@import "tailwindcss";
body {
  margin: 0;
  background: #f8fafc;
  font-family: system-ui, sans-serif;
}
```

- [ ] **Step 5: Verify dev server**

Run: `pnpm dev`  
Expected: Vite welcome page at `http://localhost:5173`

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "chore: scaffold frontend with Vite React TS"
```

---

## Task 2: Core Types

**Files:**
- Create: `frontend/src/types/cube.ts`

- [ ] **Step 1: Write types**

```typescript
// frontend/src/types/cube.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/types/cube.ts
git commit -m "feat: add core cube domain types"
```

---

## Task 3: Unfold Layout Data (11 Nets)

**Files:**
- Create: `frontend/src/data/unfoldLayouts.ts`
- Create: `frontend/src/data/__tests__/unfoldLayouts.test.ts`

- [ ] **Step 1: Write failing validation test**

```typescript
// frontend/src/data/__tests__/unfoldLayouts.test.ts
import { describe, it, expect } from 'vitest'
import { UNFOLD_LAYOUTS } from '../unfoldLayouts'
import { FACE_IDS } from '@/types/cube'

describe('UNFOLD_LAYOUTS', () => {
  it('has exactly 11 layouts', () => {
    expect(UNFOLD_LAYOUTS).toHaveLength(11)
  })

  it('each layout has 6 unique faces', () => {
    for (const layout of UNFOLD_LAYOUTS) {
      const ids = layout.cells.map((c) => c.faceId)
      expect(new Set(ids).size).toBe(6)
      expect(ids.sort()).toEqual([...FACE_IDS].sort())
    }
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm add -D vitest
# add to package.json scripts: "test": "vitest"
pnpm test frontend/src/data/__tests__/unfoldLayouts.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement `unfoldLayouts.ts` with all 11 nets**

Define `UNFOLD_LAYOUTS: UnfoldLayout[]`. Each entry includes:
- `cells`: grid positions for unfold view (unit square grid)
- `cubePoses`: standard unit cube face transforms (front at z=0.5, etc.)
- `foldSequence`: pedagogical fold order for step mode

Start with layout id `1` (classic T-shape) as reference:

```typescript
// excerpt — full file defines ids 1–11
{
  id: 1,
  name: 'T 型 1',
  cells: [
    { faceId: 'front', gridX: 1, gridY: 1 },
    { faceId: 'left', gridX: 0, gridY: 1 },
    { faceId: 'right', gridX: 2, gridY: 1 },
    { faceId: 'back', gridX: 3, gridY: 1 },
    { faceId: 'top', gridX: 1, gridY: 0 },
    { faceId: 'bottom', gridX: 1, gridY: 2 },
  ],
  foldSequence: [
    ['left'], ['right'], ['back'], ['top'], ['bottom'],
  ],
  cubePoses: { /* see design spec §7.1 unit cube */ },
}
```

Implement remaining 10 nets using standard 行测 net catalog (all 11 distinct hexomino nets of a cube).

- [ ] **Step 4: Run tests — expect PASS**

```bash
pnpm test frontend/src/data/__tests__/unfoldLayouts.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/data/
git commit -m "feat: add 11 cube unfold layout definitions"
```

---

## Task 4: Zustand Store

**Files:**
- Create: `frontend/src/store/cubeStore.ts`
- Create: `frontend/src/lib/emptyFaceJson.ts`

- [ ] **Step 1: Empty face helper**

```typescript
// frontend/src/lib/emptyFaceJson.ts
export function emptyFabricJson() {
  return { version: '6.0.0', objects: [] }
}
```

- [ ] **Step 2: Implement store**

```typescript
// frontend/src/store/cubeStore.ts
import { create } from 'zustand'
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
  setMode: (m: AppMode) => void
  setUnfoldType: (t: UnfoldType) => void
  setActiveFace: (f: FaceId) => void
  setTool: (t: EditorTool) => void
  updateFaceJson: (faceId: FaceId, json: object) => void
  loadProject: (p: CubeProject) => void
  newProject: (name?: string) => void
  setStepFoldIndex: (i: number) => void
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
  setMode: (mode) => set({ mode }),
  setUnfoldType: (unfoldType) => set({ unfoldType }),
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
  loadProject: (project) => set({ project }),
  newProject: (name) => set({ project: createEmptyProject(name), stepFoldIndex: 0 }),
  setStepFoldIndex: (stepFoldIndex) => set({ stepFoldIndex }),
}))
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/store/ frontend/src/lib/emptyFaceJson.ts
git commit -m "feat: add Zustand cube store"
```

---

## Task 5: App Shell Layout

**Files:**
- Create: `frontend/src/components/AppShell.tsx`
- Create: `frontend/src/components/TopBar.tsx`
- Create: `frontend/src/components/ToolBar.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Build dual-panel shell (bright B style)**

`AppShell.tsx` — grid layout: top bar, main `grid-cols-[3fr_2fr]`, bottom toolbar.

`TopBar.tsx` — placeholder buttons: 示例题, 展开图, 保存, 新建 (wire in later tasks).

`ToolBar.tsx` — tool buttons bound to `useCubeStore().setTool`.

- [ ] **Step 2: Replace `App.tsx`**

```tsx
import { AppShell } from '@/components/AppShell'

export default function App() {
  return <AppShell />
}
```

- [ ] **Step 3: Manual check**

Run `pnpm dev` — see top bar, empty left/right panels, bottom tools.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ frontend/src/App.tsx
git commit -m "feat: add dual-panel app shell"
```

---

## Task 6: Fabric Face Canvas + Line Tool

**Files:**
- Create: `frontend/src/editor/FabricFaceCanvas.tsx`
- Create: `frontend/src/editor/tools/lineTool.ts`
- Create: `frontend/src/lib/faceCanvas.ts`
- Create: `frontend/src/components/EditorPanel.tsx`

- [ ] **Step 1: Offscreen face canvas helper**

```typescript
// frontend/src/lib/faceCanvas.ts
export const FACE_SIZE = 512

export function createFaceCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = FACE_SIZE
  c.height = FACE_SIZE
  return c
}
```

- [ ] **Step 2: FabricFaceCanvas component**

- Mount `<canvas>` ref
- On mount: `new Canvas(el, { width: 512, height: 512, backgroundColor: '#fff' })`
- Load `fabricJson` from store for `activeFace`
- On `object:added` / `object:modified` / `object:removed` → `updateFaceJson`
- Switch face: save current JSON, load new face JSON

- [ ] **Step 3: Line tool with snap + shift constraint**

```typescript
// frontend/src/editor/tools/lineTool.ts
import { Line, Canvas, Point } from 'fabric'

const GRID = 8

export function snap(v: number) {
  return Math.round(v / GRID) * GRID
}

export function attachLineTool(canvas: Canvas) {
  let start: Point | null = null

  const onDown = (opt: any) => {
    const p = canvas.getPointer(opt.e)
    start = new Point(snap(p.x), snap(p.y))
  }

  const onUp = (opt: any) => {
    if (!start) return
    const p = canvas.getPointer(opt.e)
    let x2 = snap(p.x)
    let y2 = snap(p.y)
    if (opt.e.shiftKey) {
      const dx = Math.abs(x2 - start.x)
      const dy = Math.abs(y2 - start.y)
      if (dx > dy) y2 = start.y
      else x2 = start.x
    }
    canvas.add(new Line([start.x, start.y, x2, y2], {
      stroke: '#111827', strokeWidth: 3, selectable: true,
    }))
    start = null
    canvas.requestRenderAll()
  }

  canvas.on('mouse:down', onDown)
  canvas.on('mouse:up', onUp)
  return () => {
    canvas.off('mouse:down', onDown)
    canvas.off('mouse:up', onUp)
  }
}
```

Wire tool when `tool === 'line'`.

- [ ] **Step 4: Embed in left panel via `EditorPanel.tsx`**

- [ ] **Step 5: Manual test — draw lines, switch faces, lines persist per face**

- [ ] **Step 6: Commit**

```bash
git add frontend/src/editor/ frontend/src/lib/faceCanvas.ts frontend/src/components/EditorPanel.tsx
git commit -m "feat: add Fabric canvas with line tool"
```

---

## Task 7: Polyline, Eraser, Undo/Redo

**Files:**
- Create: `frontend/src/editor/tools/polylineTool.ts`
- Create: `frontend/src/editor/tools/eraserTool.ts`
- Create: `frontend/src/editor/useFabricHistory.ts`

- [ ] **Step 1: Polyline tool** — multi-click, double-click finish, Esc cancel

- [ ] **Step 2: Eraser tool** — click object → `canvas.remove(obj)`

- [ ] **Step 3: History hook** — push JSON snapshot on change; undo/redo reload canvas; max 50

- [ ] **Step 4: Wire ToolBar buttons 撤销/重做**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add polyline, eraser, undo redo"
```

---

## Task 8: Shape Library (Level C)

**Files:**
- Create: `frontend/src/editor/shapes/index.ts`
- Create: `frontend/src/components/ShapeLibraryPanel.tsx`

- [ ] **Step 1: Define 6 shape factories returning Fabric Group**

```typescript
// shapes: diagonal, cross, parallel, triangle, threeDots, semiArc
export const SHAPES = {
  diagonal: () => { /* Line from corner to corner */ },
  cross: () => { /* two Lines as Group */ },
  // ...
}
```

- [ ] **Step 2: ShapeLibraryPanel** — grid of buttons; click → insert at canvas center

- [ ] **Step 3: Manual test — insert each shape, move, erase, undo**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add行测 shape library"
```

---

## Task 9: R3F Cube + Texture Sync

**Files:**
- Create: `frontend/src/scene/CubeScene.tsx`
- Create: `frontend/src/scene/CubeMesh.tsx`
- Create: `frontend/src/scene/useFaceTextures.ts`
- Create: `frontend/src/components/PreviewPanel.tsx`

- [ ] **Step 1: useFaceTextures hook**

For each `FaceId`, maintain offscreen 512 canvas; when `fabricJson` changes, render Fabric statically to canvas (hidden Fabric canvas or `loadFromJSON` + `toCanvasElement`), produce `CanvasTexture`.

- [ ] **Step 2: CubeMesh** — 6 planes using `cubePoses` from layout id 1 default; `map={textures[faceId]}`

- [ ] **Step 3: CubeScene** — `<Canvas><ambientLight /><CubeMesh /><OrbitControls /></Canvas>`

- [ ] **Step 4: Debounce texture update 16ms**

- [ ] **Step 5: Manual test — draw line on front → 3D front updates**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: add R3F cube with live face textures"
```

---

## Task 10: Unfold Grid View

**Files:**
- Create: `frontend/src/components/UnfoldGrid.tsx`

- [ ] **Step 1: Render current unfold layout as 6 clickable cells**

CSS grid from `cells.gridX/gridY`; each cell hosts mini preview or click → `setActiveFace`.

- [ ] **Step 2: When `mode === 'unfold-edit'`, show UnfoldGrid + active face editor below or overlay**

- [ ] **Step 3: TopBar unfold type dropdown → `setUnfoldType(1..11)`**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add unfold grid view with 11 net types"
```

---

## Task 11: GSAP Fold Animation

**Files:**
- Create: `frontend/src/animation/foldAnimation.ts`
- Create: `frontend/src/components/FoldControls.tsx`

- [ ] **Step 1: fastFold(unfoldType, direction: 'fold' | 'unfold')**

Animate face group refs between 2D grid positions (computed from cell coords) and `cubePoses` over 0.8s.

- [ ] **Step 2: stepFold(unfoldType, stepIndex)** — animate through `foldSequence[stepIndex]`

- [ ] **Step 3: FoldControls UI** — 快速折叠, 分步折叠, prev/next step, step indicator

- [ ] **Step 4: Manual test — fast fold both directions; step through all steps**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add fast and step fold animations"
```

---

## Task 12: Sample Questions

**Files:**
- Create: `frontend/src/data/sampleQuestions/sample-1.json`
- Create: `frontend/src/data/sampleQuestions/sample-2.json`
- Create: `frontend/src/data/sampleQuestions/sample-3.json`
- Create: `frontend/src/data/sampleQuestions/index.ts`
- Modify: `frontend/src/components/TopBar.tsx`

- [ ] **Step 1: Author 3 JSON fixtures** with realistic line patterns per spec §8

- [ ] **Step 2: TopBar dropdown loads question → `loadProject` built from sample**

- [ ] **Step 3: Add 「复制为练习」** — duplicates to editable new project

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add 3 built-in sample questions"
```

---

## Task 13: IndexedDB Persistence

**Files:**
- Create: `frontend/src/storage/projects.ts`
- Modify: `frontend/src/components/TopBar.tsx`

- [ ] **Step 1: Implement idb wrapper**

```typescript
import { openDB } from 'idb'
import type { CubeProject } from '@/types/cube'

const DB = 'cube-painter'
const STORE = 'projects'

export async function saveProject(p: CubeProject) {
  const db = await openDB(DB, 1, { upgrade(d) { d.createObjectStore(STORE) } })
  await db.put(STORE, p, p.id)
}

export async function listProjects(): Promise<CubeProject[]> {
  const db = await openDB(DB, 1)
  return db.getAll(STORE)
}

export async function deleteProject(id: string) {
  const db = await openDB(DB, 1)
  await db.delete(STORE, id)
}
```

- [ ] **Step 2: Wire 保存 / 新建 / 打开 list dialog in TopBar**

- [ ] **Step 3: Toast on IndexedDB failure (use shadcn Sonner or simple alert)**

- [ ] **Step 4: Manual test — save, refresh page, reload project**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add IndexedDB project persistence"
```

---

## Task 14: Error Handling + WebGL Guard

**Files:**
- Create: `frontend/src/components/WebGLGuard.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Detect WebGL; if missing show full-page fallback**

- [ ] **Step 2: Corrupt JSON load → reset face + toast**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add WebGL guard and load error handling"
```

---

## Task 15: Polish + README Dev Section

**Files:**
- Modify: `README.md` (remove "待创建" once frontend exists)
- Modify: `frontend/src/components/*` — spacing, hover states, face labels 前/后/…

- [ ] **Step 1: Face label overlays on unfold grid and 3D hover**

- [ ] **Step 2: Run full manual QA checklist from design spec §11**

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: UI polish and QA pass"
```

---

## Plan Self-Review

| Spec requirement | Task |
|------------------|------|
| 6-face line edit | Task 6–8 |
| Level C tools | Task 6–8 |
| 11 unfold types | Task 3, 10 |
| A+B+explore flows | Task 10, 11, modes in store |
| Fast + step fold | Task 11 |
| Real-time texture sync | Task 9 |
| 3 sample questions | Task 12 |
| IndexedDB | Task 13 |
| PC dual panel | Task 5 |
| Phase 2 stubs | Task 2 types, optional `frontend/src/api/.gitkeep` |

No TBD placeholders remain in task definitions. Types consistent: `FaceId`, `CubeProject`, `UnfoldLayout` used throughout.

---

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-06-10-cube-painter-phase1.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — implement task-by-task in this session with checkpoints  

Which approach?
