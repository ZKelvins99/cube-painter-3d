import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { CubeMesh } from '@/scene/CubeMesh'
import type { FaceId } from '@/types/cube'

function TextureRefresh({ version }: { version: number }) {
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    invalidate()
  }, [version, invalidate])
  return null
}

type CubeSceneProps = {
  canvases: Record<FaceId, HTMLCanvasElement>
  textureVersion: number
}

export function CubeScene({ canvases, textureVersion }: CubeSceneProps) {
  return (
    <Canvas
      camera={{ position: [3, 2.5, 3], fov: 45 }}
      gl={{ antialias: true }}
      frameloop="always"
      style={{ background: 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)' }}
    >
      <TextureRefresh version={textureVersion} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 6, 3]} intensity={0.8} />
      <CubeMesh canvases={canvases} textureVersion={textureVersion} />
      <OrbitControls makeDefault minDistance={2} maxDistance={8} />
    </Canvas>
  )
}
