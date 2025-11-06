<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Konva from 'konva'

// Props
interface Props {
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 600,
  height: 600
})

// State
const containerRef = ref<HTMLDivElement | null>(null)
let stage: Konva.Stage | null = null
let layer: Konva.Layer | null = null
let isDrawing = false
let currentLine: Konva.Line | null = null

// Tool state
const currentTool = ref<'pencil' | 'eraser'>('pencil')
const strokeColor = ref('#000000')
const strokeWidth = ref(5)

// Initialize Konva
onMounted(() => {
  if (!containerRef.value) return

  // Create stage
  stage = new Konva.Stage({
    container: containerRef.value,
    width: props.width,
    height: props.height
  })

  // Create layer
  layer = new Konva.Layer()
  stage.add(layer)

  // Add white background
  const background = new Konva.Rect({
    x: 0,
    y: 0,
    width: props.width,
    height: props.height,
    fill: 'white'
  })
  layer.add(background)
  layer.draw()

  // Mouse event handlers
  stage.on('mousedown touchstart', handleMouseDown)
  stage.on('mousemove touchmove', handleMouseMove)
  stage.on('mouseup touchend', handleMouseUp)
})

onBeforeUnmount(() => {
  if (stage) {
    stage.destroy()
  }
})

// Event handlers
const handleMouseDown = (_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
  if (!stage || !layer) return

  isDrawing = true
  const pos = stage.getPointerPosition()
  if (!pos) return

  currentLine = new Konva.Line({
    stroke: currentTool.value === 'eraser' ? 'white' : strokeColor.value,
    strokeWidth: strokeWidth.value,
    globalCompositeOperation: currentTool.value === 'eraser' ? 'destination-out' : 'source-over',
    lineCap: 'round',
    lineJoin: 'round',
    points: [pos.x, pos.y, pos.x, pos.y]
  })

  layer.add(currentLine)
}

const handleMouseMove = (_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
  if (!isDrawing || !stage || !currentLine) return

  const pos = stage.getPointerPosition()
  if (!pos) return

  const newPoints = currentLine.points().concat([pos.x, pos.y])
  currentLine.points(newPoints)
}

const handleMouseUp = () => {
  isDrawing = false
  currentLine = null
}

// Tool functions
const setTool = (tool: 'pencil' | 'eraser') => {
  currentTool.value = tool
}

const clearCanvas = () => {
  if (!layer || !stage) return
  
  // Remove all lines, keep background
  const shapes = layer.getChildren()
  shapes.forEach((shape, index) => {
    if (index > 0) { // Skip the background (first shape)
      shape.destroy()
    }
  })
  layer.draw()
}

// Serialization functions
const saveToJSON = () => {
  if (!stage) return ''
  return stage.toJSON()
}

const loadFromJSON = (json: string) => {
  if (!stage || !json) return
  
  try {
    const parsedStage = Konva.Node.create(json, containerRef.value!)
    if (stage) {
      stage.destroy()
    }
    stage = parsedStage as Konva.Stage
    const layers = stage.getLayers()
    layer = (layers.length > 0 ? layers[0] : null) as Konva.Layer | null
    
    // Re-attach event handlers
    if (stage) {
      stage.on('mousedown touchstart', handleMouseDown)
      stage.on('mousemove touchmove', handleMouseMove)
      stage.on('mouseup touchend', handleMouseUp)
    }
  } catch (error) {
    console.error('Failed to load from JSON:', error)
  }
}

const exportJSON = () => {
  const json = saveToJSON()
  console.log('Canvas JSON:', json)
  return json
}

// Expose methods to parent component
defineExpose({
  saveToJSON,
  loadFromJSON,
  exportJSON,
  clearCanvas
})
</script>

<template>
  <div class="drawing-board-container">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="tool-group">
        <button 
          :class="['tool-btn', { active: currentTool === 'pencil' }]"
          @click="setTool('pencil')"
          title="铅笔"
        >
          ✏️ 铅笔
        </button>
        <button 
          :class="['tool-btn', { active: currentTool === 'eraser' }]"
          @click="setTool('eraser')"
          title="橡皮擦"
        >
          🧹 橡皮擦
        </button>
        <button 
          class="tool-btn"
          @click="clearCanvas"
          title="清空画布"
        >
          🗑️ 清空
        </button>
      </div>
      
      <div class="tool-group" v-if="currentTool === 'pencil'">
        <label class="tool-label">
          颜色:
          <input 
            v-model="strokeColor" 
            type="color"
            class="color-picker"
          />
        </label>
      </div>

      <div class="tool-group">
        <label class="tool-label">
          粗细: {{ strokeWidth }}px
          <input 
            v-model.number="strokeWidth" 
            type="range"
            min="1"
            max="20"
            class="width-slider"
          />
        </label>
      </div>

      <div class="tool-group">
        <button 
          class="tool-btn"
          @click="exportJSON"
          title="导出JSON到控制台"
        >
          💾 导出JSON
        </button>
      </div>
    </div>

    <!-- Canvas Container -->
    <div ref="containerRef" class="canvas-container"></div>
  </div>
</template>

<style scoped>
.drawing-board-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-btn {
  padding: 8px 16px;
  border: 2px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.tool-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.tool-btn.active {
  border-color: #409eff;
  background-color: #ecf5ff;
  color: #409eff;
}

.tool-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.color-picker {
  width: 40px;
  height: 30px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.width-slider {
  width: 100px;
}

.canvas-container {
  display: flex;
  justify-content: center;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.canvas-container > div {
  border: 1px solid #ddd;
}
</style>
