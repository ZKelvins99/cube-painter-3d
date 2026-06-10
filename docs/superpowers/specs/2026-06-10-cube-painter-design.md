# Cube Painter 3D — Design Specification

**Date:** 2026-06-10  
**Status:** Approved  
**Author:** ZKelvins99 + brainstorming session

---

## 1. Product Summary

### 1.1 Problem

行测「正方体 / 空间重构」题要求考生在脑中完成展开图与立体图之间的转换。纯文字和静态图片难以建立稳定的空间直觉。

### 1.2 Solution

**Cube Painter 3D** 是一款 PC 端 Web 工具：用户在 6 个面上绘制行测常见的线条图形，在 11 种标准展开图与 3D 立方体之间切换，通过快速折叠与分步折叠建立「谁对谁、谁邻谁」的空间印象。

### 1.3 Target User

准备公务员行测的考生，在 PC 上刷题、对照、练习。

### 1.4 Scope Boundaries

| 阶段 | 范围 |
|------|------|
| **一期** | 纯前端；PC 优先；本地 IndexedDB 保存；3 道内置例题 |
| **二期** | 矢量编辑增强；FastAPI + MongoDB 题库；用户系统；微信小程序 |

### 1.5 Non-Goals (Phase 1)

- 用户注册 / 登录 / 云同步
- 自由涂鸦（像素级画笔）
- 移动端 / 微信小程序
- 矢量对象选中编辑（二期 D 级）

---

## 2. Design Decisions

| 决策 | 选择 | 理由 |
|------|------|------|
| 视觉风格 | B — 趣味互动风 | 明亮、圆角，适合学生刷题 |
| 核心流程 | A + B + 自由探索 | 展开→折叠、3D→展开、随意切换 |
| 线稿能力 | 一期 C，二期 D | 行测题面以线条为主 |
| 折叠动画 | C — 快速默认 + 可选分步 | 兼顾效率与教学 |
| 平台 | PC 优先 | 大屏双栏；小程序后期 |
| 技术栈 | React + R3F + Fabric + GSAP | 线稿与 3D 分工清晰，二期扩展顺 |
| 示例题 | 一期内置 3 道 | 降低上手门槛 |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────┐
│  UI Layer                                        │
│  TopBar | DualPanel (2D + 3D) | ToolBar          │
├─────────────────────────────────────────────────┤
│  Zustand Store                                   │
│  mode, unfoldType, faces, activeFace, tool       │
├──────────────┬──────────────────────────────────┤
│ Fabric.js    │ React Three Fiber                │
│ 2D per-face  │ 6 × Plane + CanvasTexture        │
│ canvas       │ OrbitControls                    │
├──────────────┴──────────────────────────────────┤
│ GSAP — unfold layout + fold / unfold animation   │
├─────────────────────────────────────────────────┤
│ IndexedDB (user projects) + bundled JSON (samples)│
└─────────────────────────────────────────────────┘
```

### 3.1 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18, Vite, TypeScript |
| 2D | Fabric.js 6.x |
| 3D | @react-three/fiber, @react-three/drei, three |
| Animation | GSAP 3 |
| State | Zustand |
| UI | Tailwind CSS, shadcn/ui |
| Storage | idb |

---

## 4. UI / UX

### 4.1 Layout (PC)

- **Top bar:** 示例题下拉、展开图类型、保存、新建
- **Left panel (60%):** 2D 展开图或单面 Fabric 画布
- **Right panel (40%):** R3F 立方体预览，OrbitControls
- **Bottom bar:** 选择 | 直线 | 折线 | 橡皮 | 图元库 | 撤销 | 重做
- **Fold controls:** 快速折叠、分步折叠（步骤条）

### 4.2 Modes

| Mode | Description |
|------|-------------|
| `unfold-edit` | 11 种展开图平铺，6 面格内可编辑 |
| `3d-view` | 3D 为主，左栏可切单面大图编辑 |
| `step-fold` | 分步折叠，步骤条控制，当前折边高亮 |

### 4.3 Visual Style

- Background: `#F8FAFC`
- Primary accent: blue `#3B82F6`, secondary orange `#F97316`
- Cards: `rounded-2xl`, soft shadow
- Transitions: 150–300ms ease

---

## 5. Data Model

### 5.1 Face IDs

```typescript
type FaceId = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'
```

### 5.2 Face Canvas

```typescript
interface FaceCanvas {
  faceId: FaceId
  fabricJson: object   // Fabric canvas.toJSON() output
}
```

### 5.3 Cube Project

```typescript
interface CubeProject {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  unfoldType: UnfoldType   // 1–11
  faces: Record<FaceId, FaceCanvas>
}
```

### 5.4 Unfold Layout

```typescript
type UnfoldType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

interface UnfoldCell {
  faceId: FaceId
  gridX: number
  gridY: number
}

interface UnfoldLayout {
  id: UnfoldType
  name: string
  cells: UnfoldCell[]
  foldSequence: FaceId[][]   // step-fold order
}
```

Each unfold type also maps to 6 face `{ position, rotation }` tuples for 3D cube state and 2D grid positions for unfold view.

### 5.5 Sample Question

```typescript
interface SampleQuestion {
  id: string
  title: string
  description: string
  unfoldType: UnfoldType
  faces: Record<FaceId, object>   // preset Fabric JSON per face
  readOnly: boolean               // true in Phase 1; copy-to-edit allowed
}
```

### 5.6 Texture

- Per-face canvas: **512 × 512 px**
- Export: `HTMLCanvasElement` → `THREE.CanvasTexture`, `needsUpdate = true`
- Debounce sync: **16 ms**

---

## 6. Line Editor (Phase 1 — Level C)

### 6.1 Tools

| Tool | Behavior |
|------|----------|
| Select | Move whole Fabric objects |
| Line | Two clicks; Shift → H/V/45°; snap 8px grid |
| Polyline | Multi-click; double-click or Enter finish; Esc cancel |
| Eraser | Click to remove entire object |
| Shapes | Insert preset from library |

### 6.2 Shape Library (Phase 1)

1. Diagonal (↘)
2. Cross (+)
3. Parallel lines (‖)
4. Corner triangle (▲)
5. Three dots
6. Semi-arc

All shapes are Fabric `Group` objects, movable as a unit.

### 6.3 History

Undo/redo stack, max 50 steps, per-face or global (implementation: global project history).

---

## 7. 3D & Animation

### 7.1 Cube

- 6 `PlaneGeometry` faces, unit cube (edge length 1)
- `OrbitControls`: rotate + zoom, no pan
- Face click in 3D → set `activeFace` in store

### 7.2 Fast Fold

- GSAP timeline, duration **0.8 s**, `power2.inOut`
- Interpolate each face from unfold 2D layout pose → cube 3D pose (or reverse)

### 7.3 Step Fold

- Driven by `foldSequence` for current `unfoldType`
- ~0.6 s per step
- UI: step indicator, prev / next / pause
- Highlight active fold edge

### 7.4 Real-time Sync

```
Fabric object:modified → debounce 16ms → render face canvas → update CanvasTexture
```

---

## 8. Sample Questions (Phase 1)

| ID | Title | Exam focus |
|----|-------|------------|
| `sample-1` | 例题1：相对面判断 | Opposite faces |
| `sample-2` | 例题2：相邻面关系 | Adjacent faces |
| `sample-3` | 例题3：展开图验证 | Net → top face |

Storage: `frontend/src/data/sampleQuestions/*.json`

User actions: load (read-only view), **duplicate to practice** (editable copy).

---

## 9. Local Persistence

- **Library:** idb
- **Store name:** `cube-painter`
- **Object store:** `projects` keyed by `CubeProject.id`
- Operations: save, list, load, delete
- Fallback: toast on failure, keep in-memory session

---

## 10. Error Handling

| Condition | Response |
|-----------|----------|
| WebGL unavailable | Full-page message, suggest Chrome/Edge |
| IndexedDB write fail | Toast + in-memory fallback |
| Corrupt face JSON | Reset face to blank, toast warning |
| Invalid unfold type | Fallback to type 1 |

---

## 11. Testing (Phase 1)

### Unit

- All 11 `UnfoldLayout` definitions: 6 unique faces, connected net
- `foldSequence` references valid `FaceId`s
- Sample question JSON validates against schema

### Manual QA Checklist

1. Load sample-1 → lines visible on unfold + 3D
2. Draw line on front → 3D front updates within 1 frame
3. Switch unfold type 1 → 11 → layout correct
4. Fast fold → cube assembled correctly
5. Step fold → steps match sequence
6. Save → reload → project restored

---

## 12. Phase 2 Outline (Not Implemented)

- Fabric vector edit: select line, drag endpoints, delete segment, copy to other face
- REST API: `POST/GET/PUT/DELETE /projects`, `GET /questions`
- Auth: JWT, user-scoped projects
- WeChat mini program: reuse JSON schema + fold logic

### 12.1 Reserved Paths

```
frontend/src/types/question.ts    # shared with future API
frontend/src/api/                 # empty, commented stubs
```

---

## 13. Project Structure

```
cube-painter-3d/
├── frontend/
│   ├── src/
│   │   ├── components/       # layout, toolbar, panels
│   │   ├── editor/           # Fabric wrapper, tools, shapes
│   │   ├── scene/            # R3F cube, textures, controls
│   │   ├── animation/        # GSAP fold timelines
│   │   ├── store/            # Zustand
│   │   ├── data/             # unfoldLayouts, sampleQuestions
│   │   ├── storage/          # IndexedDB
│   │   └── types/            # shared types
│   └── ...
├── docs/superpowers/
│   ├── specs/                # this file
│   └── plans/                # implementation plan
└── README.md
```

---

## Appendix: 11 Cube Nets

The 11 distinct nets of a cube are the standard set used in 行测. Each net is a polyomino of 6 squares. Implementation stores explicit grid coordinates per net; names are descriptive (e.g. 「T 型」「L 型」「1×4 条」) for UI display only.
