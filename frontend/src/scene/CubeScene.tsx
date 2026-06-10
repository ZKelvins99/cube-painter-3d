import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { CubeMesh } from '@/scene/CubeMesh'

export function CubeScene() {
  return (
    <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 2]} intensity={1} />
      <CubeMesh />
      <OrbitControls />
    </Canvas>
  )
}
