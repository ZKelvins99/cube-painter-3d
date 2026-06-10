import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { CubeMesh } from '@/scene/CubeMesh'

export function CubeScene() {
  return (
    <Canvas
      camera={{ position: [3, 2.5, 3], fov: 45 }}
      gl={{ antialias: true }}
      style={{ background: 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)' }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 6, 3]} intensity={0.8} />
      <CubeMesh />
      <OrbitControls makeDefault minDistance={2} maxDistance={8} />
    </Canvas>
  )
}
