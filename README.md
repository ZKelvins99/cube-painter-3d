# 交互式3D方块绘画项目 - 开发路线图

欢迎来到你的下一个“王炸”项目！本项目旨在创建一个高度交互式的 Web 应用，用户可以在一个 3D 立方体的 6 个面上自由绘画。该立方体可以在 3D 形态和 11 种 2D 展开图之间进行流畅的动画切换。

**开发者:** ZKelvins99
**开始日期:** 2025-11-05

## 核心技术栈 (Tech Stack)

-   **前端 (Frontend):** Vue 3 (Composition API with `<script setup>`), Vite
-   **2D 绘图:** Konva.js
-   **3D 渲染与动画:** Three.js + GSAP (GreenSock Animation Platform)
-   **后端 (Backend):** Python 3, FastAPI
-   **数据库 (Database):** MongoDB
-   **状态管理 (可选):** Pinia
-   **部署 (Deployment):** Docker, Nginx

---

## 开发路线图 (Development Roadmap)

请严格按照以下顺序推进。每一步都是下一阶段的基础。当你需要帮助时，复制对应的 **"给AI的提示词"** 并发送给 AI 助手。

### 阶段 0: 万事开头 - 环境搭建 (预计: 1 天)

**目标:** 创建前后端项目骨架，确保开发环境正常。

-   **任务:**
    1.  使用 Vite 创建 Vue 3 (TypeScript) 前端项目。
    2.  创建 Python 虚拟环境和 FastAPI 后端项目。
    3.  本地安装或注册云 MongoDB 实例。

-   **给AI的提示词:**
    ```
    你好，我正在开始一个新项目。请为我提供详细的步骤和命令行指令，以完成以下环境搭建：
    1. 使用 Vite 创建一个名为 `frontend` 的 Vue 3 + TypeScript 项目，并安装 `konva`, `three`, `gsap`, `axios`, `pinia`。
    2. 在项目根目录创建一个 `backend` 文件夹，在其中使用 Python 3 虚拟环境，并安装 `fastapi[all]`, `motor`, `passlib[bcrypt]`, `python-jose`。
    3. 提供一个最基础的 FastAPI `main.py` 文件结构，包含一个返回 "Hello World" 的根路由。
    ```

---

### 阶段 1: 核心2D绘图功能 (Konva.js) (预计: 2-3 天)

**目标:** 忘记3D，先做一个功能完整的2D在线画板。

-   **步骤 1.1: 创建基础画板**
    -   **任务:** 在 Vue 组件中集成 Konva.js，渲染出一个舞台(Stage)和层(Layer)，并能响应鼠标事件。
    -   **给AI的提示词:**
        ```
        请给我一个 Vue 3 (`<script setup>` 语法, TypeScript) 的组件示例 (`DrawingBoard.vue`)。
        这个组件需要：
        1. 初始化一个 Konva.js 的 Stage 和 Layer。
        2. 在屏幕上监听鼠标的 `mousedown`, `mousemove`, `mouseup` 事件。
        3. 当鼠标按下并移动时，在 Layer 上画出一条简单的自由曲线（使用 `Konva.Line`）。
        请提供完整的、可直接运行的组件代码。
        ```

-   **步骤 1.2: 实现绘图工具**
    -   **任务:** 添加工具栏，实现铅笔、橡皮擦、直线等工具的切换。
    -   **给AI的提示词:**
        ```
        基于之前的 `DrawingBoard.vue` 组件，请帮我进行扩展：
        1. 添加一个工具栏，包含“铅笔”和“橡皮擦”两个按钮。
        2. 实现一个 `currentTool` 状态变量，用于在两个工具间切换。
        3. 当选择“铅笔”时，正常画线。
        4. 当选择“橡皮擦”时，设置 Konva 的 `globalCompositeOperation = 'destination-out'` 来实现擦除效果。
        请展示如何修改 `<template>` 和 `<script>` 部分来支持这个功能。
        ```

-   **步骤 1.3: 画布序列化**
    -   **任务:** 实现将 Konva 画布内容导出为 JSON，并能从 JSON 恢复画布。
    -   **给AI的提示词:**
        ```
        在我的 Konva.js 画板组件中，请帮我添加两个按钮和对应的功能：
        1. "保存 (toJSON)" 按钮：点击后，调用 `stage.toJSON()` 将当前画布内容序列化，并打印在控制台。
        2. "加载 (fromJSON)" 按钮：点击后，能从一个预设的 JSON 字符串中恢复整个画布的内容。
        请提供具体的函数实现方法。
        ```

---

### 阶段 2: 后端 API 与数据库 (FastAPI + MongoDB) (预计: 2-3 天)

**目标:** 为画板数据提供可靠的云端存储服务。

-   **步骤 2.1: 定义数据模型**
    -   **任务:** 使用 Pydantic 定义用户和项目的数据结构。
    -   **给AI的提示词:**
        ```
        我正在使用 FastAPI 和 MongoDB。请帮我使用 Pydantic 定义以下数据模型：
        1. `UserInDB`: 用于数据库的用户模型，包含 `username`, `hashed_password`, 和 `role` (如 'free', 'vip')。
        2. `Project`: 用于存储绘图项目的模型。它应包含 `name` (项目名), `owner` (用户名), 和 `faces_data` (一个字典，键是 "face1" 到 "face6"，值是任意 JSON 对象，用于存储 Konva 数据)。
        3. 顺便提供一个 `database.py` 文件示例，展示如何使用 `motor` 异步连接到 MongoDB。
        ```

-   **步骤 2.2: 实现项目 CRUD API**
    -   **任务:** 编写用于创建、读取、更新、删除绘图项目的 API 端点。
    -   **给AI的提示词:**
        ```
        基于之前定义的 Pydantic 模型和 MongoDB 连接，请为我提供 FastAPI 的 API 端点实现：
        1. `POST /projects/`: 创建一个新项目，将其存入 MongoDB。
        2. `GET /projects/{project_id}`: 根据 ID 从 MongoDB 获取一个项目。
        3. `PUT /projects/{project_id}`: 更新一个已有的项目。
        4. `GET /projects/by_user/{username}`: 获取某个用户的所有项目列表。
        所有这些端点都应该是异步的 (`async def`)。
        ```

---

### 阶段 3: 前后端打通与 3D 场景建立 (预计: 3-4 天)

**目标:** 将 2D 画布变成 3D 物体的皮肤。

-   **步骤 3.1: 前后端连接**
    -   **任务:** 在 Vue 中调用后端 API，实现保存和加载功能。管理 6 个面的数据。
    -   **给AI的提示词:**
        ```
        在我的 Vue 3 项目中，我需要将 6 个 Konva 画布的数据与后端 API 对接。请指导我：
        1. 如何在 Vue 中维护一个包含 6 个 Konva 画布状态的数据结构。
        2. 创建一个 UI（例如 6 个按钮）来切换当前编辑的画布。
        3. 点击“保存”按钮时，如何将这 6 个画布的 JSON 数据整合起来，通过 `axios` 发送到后端的 `POST /projects/` 接口。
        ```

-   **步骤 3.2: 建立 3D 场景**
    -   **任务:** 集成 Three.js，创建 6 个独立的 3D 平面，并将 6 个 Konva 画布作为它们的纹理。
    -   **给AI的提示词:**
        ```
        这是项目的关键一步！请给我一个 Vue 3 组件的示例，它能同时包含 Konva.js 和 Three.js。
        具体要求：
        1. 页面上创建 6 个隐藏的 Konva `<canvas>` 元素。
        2. 创建一个 Three.js 场景，里面有 6 个独立的 `THREE.PlaneGeometry`（平面）。
        3. 将这 6 个 Konva 画布分别作为纹理 (`THREE.CanvasTexture`) 应用到 6 个 3D 平面上。
        4. 提供一个函数，当我在任意一个 Konva 画布上画画后，能调用它来更新对应的 3D 纹理 (即 `texture.needsUpdate = true`)。
        ```
---

### 阶段 4: 3D 变换与动画 (预计: 4-7 天)

**目标:** 实现项目最酷炫的展开/折叠动画。

-   **步骤 4.1: 实现静态变换**
    -   **任务:** 编写函数，不带动画地将 6 个面在“折叠成方块”和“平铺展开”两种状态间切换。
    -   **给AI的提示词:**
        ```
        我已将 6 个 Konva 画布作为纹理贴在了 6 个 Three.js 平面上。现在，请给我计算并提供：
        1. 一个 `foldToCube()` 函数，它能设置 6 个平面的 `position` 和 `rotation`，让它们在空间中拼接成一个标准的立方体。
        2. 一个 `unfold()` 函数，它能将 6 个平面的 `position` 设置为 "T" 字形展开图的二维坐标，并将 `rotation` 全部归零。
        请为每个平面的位置和旋转提供精确的数学值。
        ```

-   **步骤 4.2: GSAP 魔法动画**
    -   **任务:** 集成 GSAP，将静态变换变成流畅的动画。
    -   **给AI的提示词:**
        ```
        我需要使用 GSAP 来将立方体的折叠和展开过程动画化。请提供代码示例：
        1. 如何使用 `gsap.timeline()` 创建一个动画时间线。
        2. 在时间线上，为 6 个平面各自的 `position` 和 `rotation` 属性添加 `gsap.to()` 动画补间。
        3. 展示如何从展开图状态平滑地动画到折叠的立方体状态。可以先以一种展开图为例。请提供关键的动画参数，如 `duration` 和 `ease`。
        ```

---

### 阶段 5: 用户系统 (预计: 2-3 天)

**目标:** 实现多用户支持，保护用户数据。

-   **步骤 5.1: 后端用户认证**
    -   **任务:** 实现注册、登录 API，并使用 JWT 保护项目相关的 API。
    -   **给AI的提示词:**
        ```
        请为我的 FastAPI 应用提供一套完整的用户认证系统：
        1. 一个 `/register` 端点，使用 `passlib` 对用户密码进行哈希并存入 MongoDB。
        2. 一个 `/token` (登录) 端点，验证用户名和密码，成功后使用 `python-jose` 生成并返回一个 JWT。
        3. 一个可重用的 `Depends` 函数 `get_current_user`，用于保护其他 API 端点。它能验证请求头中的 JWT，并返回当前用户信息。
        4. 展示如何用这个 `get_current_user` 来保护 `POST /projects/` 接口。
        ```

-   **步骤 5.2: 前端用户认证流程**
    -   **任务:** 创建登录/注册页面，使用 Pinia 管理登录状态，并设置路由守卫。
    -   **给AI的提示词:**
        ```
        我需要为我的 Vue 3 项目添加用户认证流程。请指导我：
        1. 如何使用 Pinia 创建一个 `authStore` 来存储用户的 JWT 和登录状态。
        2. 创建一个登录页面，用户提交表单后调用后端的 `/token` 接口，并将获取的 JWT存入 `authStore` 和 localStorage。
        3. 如何使用 Vue Router 的导航守卫 (`beforeEach`)，在用户访问需要登录的页面时，检查 `authStore` 中的登录状态，如果未登录则重定向到登录页。
        ```

---

### 阶段 6: 收尾与部署 (预计: 2-4 天)

**目标:** 将你的心血之作发布到互联网上。

-   **给AI的提示词:**
    ```
    我的项目（Vue 3 前端 + FastAPI 后端 + MongoDB）已在本地开发完成。请提供一份详细的生产环境部署指南：
    1. 如何使用 Docker 和 `docker-compose.yml` 来容器化 FastAPI 应用和 MongoDB 服务。
    2. 提供一个生产环境的 Nginx 配置文件 (`nginx.conf`)，它能：
        a. 托管 Vue build 后的静态文件。
        b. 将所有 `/api` 开头的请求反向代理到 FastAPI 容器。
    3. 简要说明在云服务器上部署这套系统的基本步骤。
    ```