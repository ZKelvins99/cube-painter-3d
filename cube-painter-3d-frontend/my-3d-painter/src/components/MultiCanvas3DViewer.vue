<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import DrawingBoard from './DrawingBoard.vue'

// State
const currentFace = ref<number>(1)
const drawingBoardRefs = ref<any[]>([])
const containerRef = ref<HTMLDivElement | null>(null)
const viewMode = ref<'2d' | '3d'>('2d')

// Three.js variables
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let cube: THREE.Mesh | null = null
const textures: THREE.CanvasTexture[] = []
const materials: THREE.MeshBasicMaterial[] = []

// Canvas references for textures
const canvasRefs = ref<HTMLCanvasElement[]>([])

// Initialize Three.js scene
const initThreeJS = () => {
  if (!containerRef.value) return

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    containerRef.value.clientWidth / containerRef.value.clientHeight,
    0.1,
    1000
  )
  camera.position.z = 3

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  containerRef.value.appendChild(renderer.domElement)

  // Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4)
  directionalLight.position.set(1, 1, 1)
  scene.add(directionalLight)

  // Create cube with textures from canvases
  createCube()

  // Animation loop
  animate()
}

const createCube = () => {
  if (!scene) return

  // Create textures from canvas elements
  for (let i = 0; i < 6; i++) {
    const canvas = canvasRefs.value[i]
    if (canvas) {
      const texture = new THREE.CanvasTexture(canvas)
      texture.needsUpdate = true
      textures.push(texture)
      
      const material = new THREE.MeshBasicMaterial({ map: texture })
      materials.push(material)
    } else {
      // Fallback material
      const material = new THREE.MeshBasicMaterial({ color: 0xcccccc })
      materials.push(material)
    }
  }

  // Create cube geometry
  const geometry = new THREE.BoxGeometry(2, 2, 2)
  cube = new THREE.Mesh(geometry, materials)
  scene.add(cube)
}

const animate = () => {
  if (!renderer || !scene || !camera || !controls) return

  requestAnimationFrame(animate)
  controls.update()
  
  // Update textures
  textures.forEach(texture => {
    texture.needsUpdate = true
  })

  renderer.render(scene, camera)
}

const switchFace = (faceNumber: number) => {
  currentFace.value = faceNumber
}

// Get canvas element from Konva stage
const getCanvasFromStage = (index: number): HTMLCanvasElement | null => {
  const ref = drawingBoardRefs.value[index]
  if (!ref) return null
  
  // Try to get the Konva canvas
  const container = ref.$el?.querySelector('.canvas-container')
  if (!container) return null
  
  const canvas = container.querySelector('canvas')
  return canvas
}

// Update canvas refs when drawing boards are mounted
const updateCanvasRefs = () => {
  setTimeout(() => {
    for (let i = 0; i < 6; i++) {
      const canvas = getCanvasFromStage(i)
      if (canvas) {
        canvasRefs.value[i] = canvas
      }
    }
  }, 100)
}

// Save all faces data
const saveAllFaces = () => {
  const facesData: Record<string, string> = {}
  
  drawingBoardRefs.value.forEach((ref, index) => {
    if (ref && ref.saveToJSON) {
      facesData[`face${index + 1}`] = ref.saveToJSON()
    }
  })
  
  console.log('All faces data:', facesData)
  return facesData
}

// Load all faces data
const loadAllFaces = (facesData: Record<string, string>) => {
  Object.keys(facesData).forEach((key) => {
    const index = parseInt(key.replace('face', '')) - 1
    if (drawingBoardRefs.value[index] && drawingBoardRefs.value[index].loadFromJSON) {
      drawingBoardRefs.value[index].loadFromJSON(facesData[key])
    }
  })
}

onMounted(() => {
  updateCanvasRefs()
  
  // Initialize Three.js after a short delay to ensure canvases are ready
  setTimeout(() => {
    if (containerRef.value) {
      initThreeJS()
    }
  }, 200)
})

onBeforeUnmount(() => {
  if (renderer) {
    renderer.dispose()
  }
  if (controls) {
    controls.dispose()
  }
})

// Watch for canvas ref changes and update textures
watch(drawingBoardRefs, () => {
  updateCanvasRefs()
}, { deep: true })

defineExpose({
  saveAllFaces,
  loadAllFaces
})
</script>

<template>
  <div class="multi-canvas-3d-viewer">
    <!-- View Mode Toggle -->
    <div class="mode-controls">
      <button 
        :class="['mode-btn', { active: viewMode === '2d' }]"
        @click="viewMode = '2d'"
      >
        📝 2D 编辑模式
      </button>
      <button 
        :class="['mode-btn', { active: viewMode === '3d' }]"
        @click="viewMode = '3d'"
      >
        🎲 3D 预览模式
      </button>
    </div>

    <!-- 2D Mode: Drawing Boards -->
    <div v-if="viewMode === '2d'" class="canvas-2d-mode">
      <!-- Face Selector -->
      <div class="face-selector">
        <button
          v-for="i in 6"
          :key="i"
          :class="['face-btn', { active: currentFace === i }]"
          @click="switchFace(i)"
        >
          面 {{ i }}
        </button>
      </div>

      <!-- Drawing Boards (hidden ones for texture generation) -->
      <div class="drawing-boards">
        <div 
          v-for="i in 6" 
          :key="i"
          :class="['board-wrapper', { visible: currentFace === i }]"
        >
          <DrawingBoard 
            :ref="el => { if (el) drawingBoardRefs[i - 1] = el }"
            :width="600" 
            :height="600"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button class="action-btn" @click="saveAllFaces">
          💾 保存所有面
        </button>
      </div>
    </div>

    <!-- 3D Mode: Three.js Viewer -->
    <div v-else class="canvas-3d-mode">
      <div ref="containerRef" class="threejs-container"></div>
      <div class="viewer-info">
        <p>🖱️ 拖动旋转 | 🔍 滚轮缩放</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.multi-canvas-3d-viewer {
  width: 100%;
  min-height: 100vh;
  padding: 20px;
}

.mode-controls {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 20px;
}

.mode-btn {
  padding: 12px 24px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
}

.mode-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.mode-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 2D Mode Styles */
.canvas-2d-mode {
  max-width: 1200px;
  margin: 0 auto;
}

.face-selector {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.face-btn {
  padding: 10px 20px;
  border: 2px solid #ddd;
  border-radius: 6px;
  background-color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.face-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.face-btn.active {
  border-color: #409eff;
  background-color: #ecf5ff;
  color: #409eff;
  font-weight: 600;
}

.drawing-boards {
  position: relative;
  min-height: 700px;
}

.board-wrapper {
  display: none;
}

.board-wrapper.visible {
  display: block;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

.action-btn {
  padding: 12px 32px;
  border: 2px solid #67c23a;
  border-radius: 8px;
  background-color: white;
  color: #67c23a;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
}

.action-btn:hover {
  background-color: #67c23a;
  color: white;
}

/* 3D Mode Styles */
.canvas-3d-mode {
  max-width: 1200px;
  margin: 0 auto;
}

.threejs-container {
  width: 100%;
  height: 600px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.viewer-info {
  text-align: center;
  margin-top: 16px;
  color: white;
  font-size: 14px;
  opacity: 0.9;
}

.viewer-info p {
  margin: 0;
}
</style>
