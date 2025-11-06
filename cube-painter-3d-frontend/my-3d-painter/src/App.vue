<script setup lang="ts">
import MultiCanvas3DViewer from './components/MultiCanvas3DViewer.vue'
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>🎨 交互式3D方块绘画</h1>
      <p>Interactive 3D Cube Painter</p>
    </header>
    <main class="app-main">
      <MultiCanvas3DViewer />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.app-header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.app-header h1 {
  font-size: 2.5rem;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.app-header p {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
}

.app-main {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
