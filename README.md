<div align="center">

# Cube Painter 3D

**行测正方体空间可视化工具 — 画线、折叠、建立空间直觉**

在 2D 展开图与 3D 立方体之间自由切换，用交互代替想象。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Phase](https://img.shields.io/badge/Phase-1%20Frontend-green)
![Platform](https://img.shields.io/badge/Platform-PC%20First-lightgrey)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20R3F%20%7C%20Fabric-646cff)

[功能特性](#-功能特性) ·
[快速开始](#-快速开始) ·
[技术架构](#-技术架构) ·
[路线图](#-路线图) ·
[项目结构](#-项目结构)

</div>

---

## 简介

**Cube Painter 3D** 是一款面向 **公务员行测「正方体 / 空间重构」** 题型的可视化学习工具。

行测里的正方体题，难点往往不在计算，而在 **脑中折叠**。本项目通过：

- 在 **6 个面** 上绘制行测常见的 **线条与图元**
- 在 **11 种标准展开图** 与 **3D 立方体** 之间流畅切换
- **快速折叠** 与 **分步折叠** 两种模式对照验证

帮助你在操作过程中形成清晰的空间印象，而不是死记答案。

> 一期聚焦 **纯前端 PC 体验**；云题库与用户系统规划在二期。

---

## ✨ 功能特性

### 一期（MVP）

| 模块 | 能力 |
|------|------|
| **6 面线稿编辑** | 在虚拟立方体每个面上独立绘制线条图形 |
| **精准线稿工具** | 直线（正交约束 + 端点吸附）、折线、橡皮 |
| **行测图元库** | 对角线、十字、平行线、三角、三点、半弧等预设图元 |
| **11 种展开图** | 覆盖行测常考的全部正方体展开图形态 |
| **3D ↔ 2D 双向** | 展开图编辑 → 折成立方体；3D 观察 → 展开对照 |
| **双模式折叠动画** | 默认快速切换；可选分步折叠逐步理解折法 |
| **实时纹理同步** | 任意面绘画后，3D 立方体对应面即时更新 |
| **内置例题** | 3 道行测风格示例题，一键加载演示 |
| **本地保存** | IndexedDB 保存练习，无需登录 |

### 二期（规划）

- 矢量编辑增强（选中线段、拖端点、复制到其他面）
- 云端题库 CRUD 与用户系统
- 微信小程序（验证产品价值后）

---

## 🖥 界面概览

```
┌──────────────────────────────────────────────────────────────┐
│ 顶栏：示例题 | 展开图类型 | 保存 | 新建                          │
├────────────────────────────┬─────────────────────────────────┤
│  左栏 · 2D 展开图 / 面编辑   │  右栏 · 3D 立方体实时预览         │
│  (Fabric.js)               │  (React Three Fiber)            │
├────────────────────────────┴─────────────────────────────────┤
│ 工具：选择 | 直线 | 折线 | 橡皮 | 图元库 | 撤销 | 重做          │
└──────────────────────────────────────────────────────────────┘
```

> 明亮、圆角的 **趣味互动风** UI，面向刷题场景，PC 大屏双栏布局。

<!-- 上线后替换为真实截图 -->
<!-- ![Demo](./docs/assets/demo.png) -->

---

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 18
- **pnpm** ≥ 8（推荐）或 npm / yarn
- 现代浏览器：**Chrome / Edge** 最新版（需 WebGL）

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/ZKelvins99/cube-painter-3d.git
cd cube-painter-3d

# 进入前端目录（一期仅 frontend）
cd frontend
pnpm install
pnpm dev
```

浏览器访问 `http://localhost:5173`，即可使用双栏工作台：左侧 2D 展开图编辑，右侧 3D 立方体实时预览。

### 构建与测试

```bash
cd frontend
pnpm build    # 或 npm run build
pnpm test     # 或 npm run test
```

---

## 🏗 技术架构

### 技术栈

| 层级 | 选型 | 职责 |
|------|------|------|
| 框架 | React 18 + Vite + TypeScript | 应用骨架、组件化 UI |
| 2D 线稿 | **Fabric.js** | 矢量直线、折线、图元库、撤销重做 |
| 3D 渲染 | **React Three Fiber** + drei | 6 面贴图立方体、轨道控制 |
| 动画 | **GSAP** | 展开图布局变换、快速/分步折叠时间轴 |
| 状态 | **Zustand** | 6 面数据、模式、展开图类型 |
| UI | Tailwind CSS + shadcn/ui | 明亮 B 风格组件 |
| 存储 | idb (IndexedDB) | 本地练习持久化 |

### 系统分层

```
┌─────────────────────────────────────────┐
│  UI：双栏工作台 + 工具栏 + 示例题面板      │
├─────────────────────────────────────────┤
│  Zustand 应用状态                        │
├──────────────┬──────────────────────────┤
│ Fabric.js    │ React Three Fiber        │
│ 2D 线稿引擎   │ 3D 贴图 + 折叠位姿        │
├──────────────┴──────────────────────────┤
│ GSAP 动画（快速折叠 / 分步折叠）           │
├─────────────────────────────────────────┤
│ IndexedDB + 内置 JSON 示例题             │
└─────────────────────────────────────────┘
```

### 六面命名

| 键 | 中文 | 键 | 中文 |
|----|------|----|------|
| `front` | 前 | `back` | 后 |
| `left` | 左 | `right` | 右 |
| `top` | 上 | `bottom` | 下 |

展开图、3D 立方体、序列化数据统一使用以上键名，避免空间关系歧义。

### 数据流（贴图同步）

```
Fabric 画布变更 → debounce → CanvasTexture 更新 → R3F 对应面重绘
```

---

## 🗺 路线图

### Phase 1 — 前端 MVP（当前）

- [x] 项目脚手架（`frontend/` React + Vite + TS）
- [x] Fabric 线稿编辑器（直线、折线、图元库 C 级）
- [x] R3F 立方体 + 6 面实时贴图
- [x] 11 种展开图布局与切换
- [x] GSAP 快速折叠 + 分步折叠
- [x] 3 道内置行测例题
- [x] IndexedDB 本地保存

### Phase 2 — 后端与增强（规划）

- [ ] 矢量编辑 D 级（选中线段、拖端点、跨面复制）
- [ ] FastAPI + MongoDB 题库与用户系统
- [ ] 微信小程序

---

## 📁 项目结构

```
cube-painter-3d/
├── frontend/                 # 一期：React 前端
│   ├── src/
│   │   ├── components/       # UI 组件
│   │   ├── editor/           # Fabric 2D 编辑器
│   │   ├── scene/            # R3F 3D 场景
│   │   ├── store/            # Zustand 状态
│   │   ├── data/             # 11 种展开图 + 示例题 JSON
│   │   └── types/            # 共享类型（二期 API 复用）
│   └── ...
├── docs/
│   └── superpowers/
│       └── specs/            # 设计文档
├── README.md
└── LICENSE                   # MIT（待添加）
```

---

## 🎯 设计目标

| 目标 | 说明 |
|------|------|
| **好看** | 明亮配色、圆角卡片、轻动效，降低刷题疲劳 |
| **线稿优先** | 行测题面以线条图形为主，工具围绕精准画线设计 |
| **可理解** | 分步折叠让「这一面折向哪里」看得见 |
| **YAGNI** | 一期不做后端；验证价值后再扩展 |

详细设计见 [`docs/superpowers/specs/2026-06-10-cube-painter-design.md`](docs/superpowers/specs/2026-06-10-cube-painter-design.md)  
实现计划见 [`docs/superpowers/plans/2026-06-10-cube-painter-phase1.md`](docs/superpowers/plans/2026-06-10-cube-painter-phase1.md)

---

## 🤝 贡献

欢迎 Issue 与 PR。一期开发中，请先查阅路线图确认范围。

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feat/amazing-feature`
3. 提交改动：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feat/amazing-feature`
5. 发起 Pull Request

---

## 📄 License

[MIT](LICENSE) © [ZKelvins99](https://github.com/ZKelvins99)

---

<div align="center">

**如果这个项目帮你搞懂了行测正方体题，欢迎 Star ⭐**

</div>
